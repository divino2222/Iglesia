-- =====================================================================
-- 05_nucleo_verificar.sql  ·  Después de los Pasos 1–3 · Solo lectura
-- Ejecutar cada bloque por separado.
-- =====================================================================

-- 1) Roles: todos con role_id y texto sincronizado (esperado: 0 filas)
select p.id, p.full_name, p.role, r.name
from public.profiles p
left join public.roles r on r.id = p.role_id
where r.id is null or p.role is distinct from r.name;

-- 2) Distribución final de roles
select r.name as rol, count(*) as perfiles
from public.profiles p join public.roles r on r.id = p.role_id
group by r.name order by perfiles desc;

-- 3) Permisos del rol member (esperado: notifications.view, profile.manage_own)
select pm.name
from public.roles r
join public.role_permissions rp on rp.role_id = r.id
join public.permissions pm on pm.id = rp.permission_id
where r.name = 'member';

-- 4) Cada server antiguo tiene perfil (esperado: 0 filas)
select s.full_name, s.email
from public.servers_legacy s
where not exists (
  select 1 from public.profiles p
  where p.auth_user_id = s.auth_user_id
     or lower(p.email) = lower(s.email)
     or (p.full_name = s.full_name and p.phone is not distinct from s.phone)
);

-- 5) Asignaciones: esperado 21 (17 + 6 - 2)
select count(*) as service_assignments from public.service_assignments;

-- 6) Ninguna asignación antigua quedó fuera (esperado: 0 filas)
select a.*
from public.assignments_legacy a
where not exists (
  select 1 from public.service_assignments s
  where s.service_plan_id = a.service_plan_id
    and s.team_id = a.team_id
    and s.profile_id = a.profile_id
);

-- 7) La duplicada que estaba confirmed vs pending: ¿cómo quedó?
select s.id, s.status, s.confirmed_at, s.updated_at, a.status as status_antiguo
from public.assignments_legacy a
join public.service_assignments s
  on s.service_plan_id = a.service_plan_id
 and s.team_id = a.team_id
 and s.profile_id = a.profile_id;

-- 8) La vista de compatibilidad responde y es security_invoker
select count(*) as filas_vista from public.assignments;

select relname, reloptions from pg_class
where oid = 'public.assignments'::regclass;

-- 9) FK del checklist apunta a service_assignments
select conname, confrelid::regclass as apunta_a
from pg_constraint
where conrelid = 'public.assignment_checklist'::regclass and contype = 'f';
