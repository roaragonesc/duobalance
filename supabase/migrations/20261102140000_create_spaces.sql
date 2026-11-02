-- DuoBalance · Fase 3: espacios compartidos y miembros.
-- Solo crea objetos nuevos; no modifica ni borra nada existente.
--
-- Reglas garantizadas en PostgreSQL (no solo en la interfaz):
--   * Un espacio tiene como máximo dos miembros, también con peticiones
--     concurrentes (bloqueo de la fila del espacio en un trigger).
--   * Cada usuario pertenece como máximo a un espacio (índice único).
--   * Un espacio se crea siempre junto a su creador en la misma transacción
--     (función create_space + trigger diferido que rechaza espacios vacíos).
--   * Nadie puede leer espacios ajenos ni escribir directamente en las tablas.

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null
    constraint spaces_name_length
      check (char_length(btrim(name)) between 1 and 60),
  split_method text not null
    constraint spaces_split_method_valid
      check (split_method in ('equal', 'proportional')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.spaces is 'Espacio compartido entre dos personas.';
comment on column public.spaces.split_method is
  'Reparto global: equal (50/50) o proportional (según ingresos).';

create table public.space_members (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null
    constraint space_members_role_valid check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id),
  constraint space_members_one_space_per_user unique (user_id)
);

comment on table public.space_members is 'Miembros de cada espacio (máximo dos).';

create unique index space_members_one_owner_per_space
  on public.space_members (space_id)
  where role = 'owner';

create trigger spaces_set_updated_at
  before update on public.spaces
  for each row execute function public.set_updated_at();

-- Máximo dos miembros por espacio.
-- El SELECT ... FOR UPDATE serializa las altas de un mismo espacio: una
-- segunda transacción espera al commit de la primera y, en READ COMMITTED,
-- el recuento posterior ya ve la fila confirmada.

create function public.enforce_space_member_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.spaces where id = new.space_id for update;

  if (
    select count(*)
    from public.space_members
    where space_id = new.space_id
      and user_id <> new.user_id
  ) >= 2 then
    raise exception 'space_full' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger space_members_limit
  before insert or update of space_id on public.space_members
  for each row execute function public.enforce_space_member_limit();

-- Sin espacios vacíos: al confirmar la transacción el espacio debe tener
-- al menos un miembro.

create function public.ensure_space_has_member()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.space_members where space_id = new.id
  ) then
    raise exception 'space_without_members' using errcode = 'P0001';
  end if;
  return null;
end;
$$;

create constraint trigger spaces_require_member
  after insert on public.spaces
  deferrable initially deferred
  for each row execute function public.ensure_space_has_member();

-- Pertenencia del usuario actual. SECURITY DEFINER evita la recursión de
-- RLS al consultar space_members desde sus propias políticas.

create function public.is_space_member(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.space_members
    where space_id = p_space_id
      and user_id = (select auth.uid())
  );
$$;

-- Creación atómica: espacio + creador como owner en una única transacción.

create function public.create_space(p_name text, p_split_method text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_space_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if exists (select 1 from public.space_members where user_id = v_user_id) then
    raise exception 'already_in_space' using errcode = 'P0001';
  end if;

  insert into public.spaces (name, split_method)
  values (btrim(p_name), p_split_method)
  returning id into v_space_id;

  insert into public.space_members (space_id, user_id, role)
  values (v_space_id, v_user_id, 'owner');

  return v_space_id;
exception
  -- Dos peticiones simultáneas del mismo usuario: la segunda choca con el
  -- índice único y se revierte entera (incluido su espacio).
  when unique_violation then
    raise exception 'already_in_space' using errcode = 'P0001';
end;
$$;

revoke all on function public.enforce_space_member_limit() from public, anon, authenticated;
revoke all on function public.ensure_space_has_member() from public, anon, authenticated;
revoke all on function public.is_space_member(uuid) from public, anon, authenticated;
revoke all on function public.create_space(text, text) from public, anon, authenticated;
grant execute on function public.is_space_member(uuid) to authenticated;
grant execute on function public.create_space(text, text) to authenticated;

-- Permisos y Row Level Security: solo lectura de los espacios propios.
-- Las altas pasan siempre por create_space (y, en la fase 4, por la
-- aceptación de invitaciones).

alter table public.spaces enable row level security;
alter table public.space_members enable row level security;

revoke all on table public.spaces from anon, authenticated;
revoke all on table public.space_members from anon, authenticated;
grant select on table public.spaces to authenticated;
grant select on table public.space_members to authenticated;

create policy spaces_select_member
  on public.spaces
  for select
  to authenticated
  using (public.is_space_member(id));

create policy space_members_select_same_space
  on public.space_members
  for select
  to authenticated
  using (public.is_space_member(space_id));
