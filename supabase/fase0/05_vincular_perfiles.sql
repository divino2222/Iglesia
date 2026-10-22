-- =========================================================
-- FASE 0 · PASO 5 · VINCULAR PERFILES CON SU CUENTA
--
-- NO LO EJECUTES TODAVÍA. Primero revisemos juntos el
-- resultado de 01_diagnostico.sql (sección perfil_sin_cuenta).
--
-- Vincula un perfil con la cuenta que tiene su mismo correo,
-- SOLO para los correos que escribas abajo y SOLO si:
--   - el perfil aún no tiene cuenta vinculada, y
--   - esa cuenta no está ya vinculada a otro perfil.
--
-- Antes de incluir un correo, confirma con la persona
-- (en persona o por teléfono) que esa cuenta es suya.
-- =========================================================

begin;

with correos_aprobados(correo) as (
  values
    -- ('persona1@ejemplo.com'),
    -- ('persona2@ejemplo.com')
    (null::text)
)
update public.profiles p
set
  auth_user_id = u.id,
  updated_at = now()
from auth.users u
where lower(u.email) = lower(p.email)
  and lower(p.email) in (
    select lower(correo) from correos_aprobados where correo is not null
  )
  and p.auth_user_id is null
  and not exists (
    select 1 from public.profiles p2
    where p2.auth_user_id = u.id
  )
returning split_part(p.full_name, ' ', 1) as vinculado;

commit;
