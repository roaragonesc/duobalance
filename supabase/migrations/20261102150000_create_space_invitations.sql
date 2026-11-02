-- DuoBalance · Fase 4: invitaciones de pareja.
-- Solo crea objetos nuevos; no modifica ni borra nada existente.
--
-- Supabase Auth no envía invitaciones personalizadas: el creador del espacio
-- obtiene un enlace con un token aleatorio y lo comparte por su cuenta.
--   * Solo se guarda el hash SHA-256 del token, nunca el token.
--   * Caduca a los 7 días y solo se puede usar una vez.
--   * Solo puede aceptarla el usuario cuyo correo, ya confirmado, coincide
--     con el invitado.
--   * Como mucho hay una invitación pendiente por espacio y 10 creadas cada 24 h.
--   * Aceptar es idempotente y transaccional (el límite de dos miembros lo
--     sigue garantizando el trigger space_members_limit).
--   * Orden de bloqueo común (espacio -> invitación) en ambas funciones para
--     evitar interbloqueos entre crear y aceptar invitaciones.

create table public.space_invitations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  invited_email text not null
    constraint space_invitations_email_format
      check (invited_email = lower(btrim(invited_email))
        and invited_email like '_%@_%'
        and char_length(invited_email) <= 254),
  token_hash bytea not null
    constraint space_invitations_token_hash_unique unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  -- accepted_by puede quedar a null si se borra la cuenta que aceptó.
  constraint space_invitations_accepted_consistent
    check (accepted_by is null or accepted_at is not null)
);

comment on table public.space_invitations is
  'Invitaciones de pareja mediante enlace de un solo uso (solo se guarda el hash del token).';

-- "Pendiente" = ni aceptada ni revocada: una invitación caducada sigue contando
-- hasta que se revoca. create_invitation revoca la anterior (caducada o no),
-- así que nunca impide crear una nueva.
create unique index space_invitations_one_pending_per_space
  on public.space_invitations (space_id)
  where accepted_at is null and revoked_at is null;

-- Índices de las claves foráneas (borrados en cascada sin recorrer la tabla).
create index space_invitations_space_id_idx on public.space_invitations (space_id);
create index space_invitations_created_by_idx on public.space_invitations (created_by);
create index space_invitations_accepted_by_idx on public.space_invitations (accepted_by);

-- Crea una invitación y devuelve el token en claro (solo esta vez).
-- Una invitación pendiente anterior del mismo espacio queda revocada.

create function public.create_invitation(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_space_id uuid;
  v_email text := lower(btrim(p_email));
  v_token text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if v_email is null
    or char_length(v_email) > 254
    or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  select space_id into v_space_id
  from public.space_members
  where user_id = v_user_id and role = 'owner';

  if v_space_id is null then
    raise exception 'not_space_owner' using errcode = 'P0001';
  end if;

  -- Serializa las invitaciones y altas del mismo espacio.
  perform 1 from public.spaces where id = v_space_id for update;

  if (select count(*) from public.space_members where space_id = v_space_id) >= 2 then
    raise exception 'space_full' using errcode = 'P0001';
  end if;

  if v_email is not distinct from (select lower(email) from auth.users where id = v_user_id) then
    raise exception 'cannot_invite_self' using errcode = 'P0001';
  end if;

  -- Evita generar enlaces sin control (cada uno deja una fila revocada).
  if (select count(*) from public.space_invitations
      where space_id = v_space_id and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'too_many_invitations' using errcode = 'P0001';
  end if;

  update public.space_invitations
  set revoked_at = now()
  where space_id = v_space_id
    and accepted_at is null
    and revoked_at is null;

  -- 2 UUID v4 = 244 bits aleatorios, sin depender de extensiones.
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  insert into public.space_invitations (space_id, invited_email, token_hash, created_by)
  values (v_space_id, v_email, sha256(convert_to(v_token, 'UTF8')), v_user_id);

  return v_token;
end;
$$;

-- Acepta una invitación y devuelve el id del espacio.
-- Repetir la llamada con el mismo usuario devuelve el mismo espacio.

create function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_token_hash bytea := sha256(convert_to(coalesce(p_token, ''), 'UTF8'));
  v_space_id uuid;
  v_invitation public.space_invitations%rowtype;
  v_current_space uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Bloquea primero el espacio (mismo orden que create_invitation) y después
  -- la invitación; en READ COMMITTED el FOR UPDATE relee la versión vigente.
  select space_id into v_space_id
  from public.space_invitations
  where token_hash = v_token_hash;

  if v_space_id is not null then
    perform 1 from public.spaces where id = v_space_id for update;
  end if;

  select * into v_invitation
  from public.space_invitations
  where token_hash = v_token_hash
  for update;

  if not found or v_invitation.revoked_at is not null then
    raise exception 'invalid_invitation' using errcode = 'P0001';
  end if;

  if v_invitation.accepted_at is not null then
    if v_invitation.accepted_by = v_user_id
      and exists (
        select 1 from public.space_members
        where space_id = v_invitation.space_id and user_id = v_user_id
      ) then
      return v_invitation.space_id;
    end if;
    raise exception 'invitation_used' using errcode = 'P0001';
  end if;

  if v_invitation.expires_at <= now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  -- Correo confirmado e idéntico; un usuario sin correo nunca coincide.
  if not exists (
    select 1 from auth.users
    where id = v_user_id
      and email_confirmed_at is not null
      and lower(email) = v_invitation.invited_email
  ) then
    raise exception 'invitation_email_mismatch' using errcode = 'P0001';
  end if;

  select space_id into v_current_space
  from public.space_members
  where user_id = v_user_id;

  if v_current_space is not null then
    raise exception 'already_in_space' using errcode = 'P0001';
  end if;

  insert into public.space_members (space_id, user_id, role)
  values (v_invitation.space_id, v_user_id, 'member');

  update public.space_invitations
  set accepted_at = now(), accepted_by = v_user_id
  where id = v_invitation.id;

  return v_invitation.space_id;
exception
  when unique_violation then
    raise exception 'already_in_space' using errcode = 'P0001';
end;
$$;

revoke all on function public.create_invitation(text) from public, anon, authenticated;
revoke all on function public.accept_invitation(text) from public, anon, authenticated;
grant execute on function public.create_invitation(text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;

-- Sin acceso directo: todo pasa por las funciones anteriores.

alter table public.space_invitations enable row level security;
revoke all on table public.space_invitations from anon, authenticated;
