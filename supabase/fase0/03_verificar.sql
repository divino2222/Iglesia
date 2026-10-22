-- =========================================================
-- FASE 0 · PASO 3 · VERIFICACIÓN (SOLO LECTURA)
--
-- Resultado esperado:
--   - rls: todas con rls=true
--   - acceso_anon: TODO en false
--   - acceso_authenticated: select=true (salvo servers=false),
--       insert/update/delete=false
--   - columnas_editables: solo las de assignments y checklist
--   - politica: solo reglas que empiezan con "fase0_"
-- =========================================================

with tablas(t) as (
  values
    ('profiles'),
    ('servers'),
    ('assignments'),
    ('service_assignments'),
    ('assignment_checklist'),
    ('service_teams'),
    ('service_plans')
)
select orden, seccion, detalle
from (
  select
    1 as orden,
    'rls'::text as seccion,
    c.relname || ' | rls=' || c.relrowsecurity as detalle
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (select t from tablas)

  union all

  select
    2,
    'acceso_' || r.rol,
    t.t
      || ' | select=' || has_table_privilege(r.rol, 'public.' || t.t, 'select')
      || ' | insert=' || has_table_privilege(r.rol, 'public.' || t.t, 'insert')
      || ' | update=' || has_table_privilege(r.rol, 'public.' || t.t, 'update')
      || ' | delete=' || has_table_privilege(r.rol, 'public.' || t.t, 'delete')
  from tablas t
  cross join (values ('anon'), ('authenticated')) as r(rol)

  union all

  select
    3,
    'columnas_editables',
    cp.grantee || ' | ' || cp.table_name || '.' || cp.column_name
      || ' | ' || cp.privilege_type
  from information_schema.column_privileges cp
  where cp.table_schema = 'public'
    and cp.table_name in (select t from tablas)
    and cp.grantee in ('anon', 'authenticated')
    and cp.privilege_type in ('INSERT', 'UPDATE')

  union all

  select
    4,
    'politica',
    p.tablename || ' | ' || p.policyname || ' | ' || p.cmd
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename in (select t from tablas)

  union all

  select
    5,
    'respaldo',
    'politicas respaldadas: '
      || (select count(*) from fase0_respaldo.politicas)
      || ' | permisos respaldados: '
      || (select count(*) from fase0_respaldo.permisos_tabla)
) resultado
order by orden, seccion, detalle;
