-- DuoBalance · Nombre de la pareja.
-- Incremental: añade una política de lectura; no modifica tablas ni datos.
-- Un miembro puede leer el perfil del otro miembro de su propio espacio
-- (solo nombre y fechas de alta). Los perfiles ajenos siguen ocultos y la
-- política de edición sigue limitada al perfil propio.
-- La subconsulta sobre space_members respeta su RLS, que solo devuelve las
-- filas del espacio del usuario.

create policy profiles_select_space_partner
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.space_members as mine
      join public.space_members as partner
        on partner.space_id = mine.space_id
      where mine.user_id = (select auth.uid())
        and partner.user_id = profiles.id
    )
  );
