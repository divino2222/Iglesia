-- =====================================================================
-- 04_nucleo_diagnostico.sql  ·  Diseño del núcleo · Solo lectura
-- Objetivo: saber qué tablas duplicadas tienen los datos reales antes de
-- unificar assignments / service_assignments, servers / profiles y
-- profiles.role / profiles.role_id.
-- No es una migración: ejecutar a mano y compartir los resultados.
-- =====================================================================

-- 1) ¿Tabla o vista? Filas aproximadas de cada pieza duplicada
select c.relname as objeto,
       case c.relkind when 'r' then 'tabla' when 'v' then 'vista'
                      when 'm' then 'vista materializada' else c.relkind::text end as tipo,
       c.reltuples::bigint as filas_aprox
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('assignments', 'service_assignments', 'servers', 'profiles',
                    'roles', 'role_permissions', 'permissions',
                    'service_plans', 'service_teams', 'assignment_checklist')
order by c.relname;

-- 2) Definición de las vistas (si alguna de las anteriores lo es)
select table_name as vista, view_definition
from information_schema.views
where table_schema = 'public'
  and table_name in ('assignments', 'service_assignments', 'servers');

-- 3) Columnas de las tablas duplicadas, lado a lado
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('assignments', 'service_assignments', 'servers', 'profiles')
order by table_name, ordinal_position;

-- 4) Llaves foráneas que apuntan a / salen de estas tablas
select tc.table_name as tabla, kcu.column_name as columna,
       ccu.table_name as referencia, ccu.column_name as columna_ref,
       tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
where tc.table_schema = 'public' and tc.constraint_type = 'FOREIGN KEY'
  and (tc.table_name in ('assignments', 'service_assignments', 'servers', 'assignment_checklist')
       or ccu.table_name in ('assignments', 'service_assignments', 'servers'))
order by tc.table_name, kcu.column_name;

-- 5) Conteos exactos y solapamiento entre assignments y service_assignments
--    (falla si alguna de las dos no existe: en ese caso, ignora este bloque)
select
  (select count(*) from public.assignments)         as total_assignments,
  (select count(*) from public.service_assignments) as total_service_assignments,
  (select count(*) from public.assignments a
     where exists (select 1 from public.service_assignments s
                   where s.service_plan_id = a.service_plan_id
                     and s.team_id = a.team_id
                     and s.profile_id = a.profile_id)) as en_ambas,
  (select max(updated_at) from public.assignments)         as ultima_mod_assignments,
  (select max(updated_at) from public.service_assignments) as ultima_mod_service_assignments;

-- 6) ¿Los ids de servers coinciden con profiles?
select
  (select count(*) from public.servers) as total_servers,
  (select count(*) from public.servers s
     join public.profiles p on p.id = s.id) as mismo_id_que_profiles,
  (select count(*) from public.servers s
     join public.profiles p on p.auth_user_id = s.auth_user_id) as mismo_auth_user_id;

-- 7) Rol de texto vs role_id: ¿cuadran?
select p.role as role_texto, r.name as role_id_nombre, count(*) as perfiles
from public.profiles p
left join public.roles r on r.id = p.role_id
group by p.role, r.name
order by perfiles desc;

-- 8) Catálogo de roles y permisos
select r.name as rol, r.label,
       string_agg(pm.name, ', ' order by pm.name) as permisos
from public.roles r
left join public.role_permissions rp on rp.role_id = r.id
left join public.permissions pm on pm.id = rp.permission_id
group by r.name, r.label
order by r.name;

-- 9) Triggers y funciones que sincronizan tablas (posibles espejos ocultos)
select event_object_table as tabla, trigger_name, action_timing, event_manipulation,
       action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
