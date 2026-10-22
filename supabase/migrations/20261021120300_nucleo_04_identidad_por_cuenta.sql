-- =====================================================================
-- Núcleo · Paso 2b · Identidad solo por cuenta (RLS)
--
-- Iguala RLS con getCurrentAccess(): el perfil se reconoce solo por
-- auth_user_id y debe estar activo. Se quita el respaldo por correo, que
-- permitía heredar el rol de un perfil sin cuenta registrándose con su
-- correo.
--
-- Ejecutar DESPUÉS de la migración 02 (que vincula cuentas por correo).
-- =====================================================================

begin;

create or replace function private.current_profile_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.is_active = true
$$;

commit;
