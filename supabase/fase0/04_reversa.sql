-- =========================================================
-- FASE 0 · REVERSA (usar SOLO si algo dejó de funcionar)
--
-- Regresa las 7 tablas exactamente al estado respaldado
-- por 02_aplicar_rls.sql: reglas, RLS y permisos.
--
-- ATENCIÓN: al revertir, los datos personales vuelven a
-- quedar expuestos a visitantes anónimos, como antes.
--
-- Conserva el esquema fase0_respaldo (no lo borra) para
-- poder revisar qué pasó.
-- =========================================================

begin;

do $$
begin
  if not exists (
    select 1 from pg_namespace where nspname = 'fase0_respaldo'
  ) then
    raise exception
      'No existe el respaldo fase0_respaldo; no hay nada que revertir.';
  end if;
end
$$;

-- 1. Quitar las reglas actuales de las 7 tablas.
do $$
declare
  v_politica record;
begin
  for v_politica in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'servers', 'assignments', 'service_assignments',
        'assignment_checklist', 'service_teams', 'service_plans'
      )
  loop
    execute format(
      'drop policy %I on public.%I',
      v_politica.policyname,
      v_politica.tablename
    );
  end loop;
end
$$;

-- 2. Recrear las reglas originales.
do $$
declare
  v_politica record;
  v_roles text;
  v_sql text;
begin
  for v_politica in
    select * from fase0_respaldo.politicas
  loop
    select string_agg(
      case
        when rol = 'public' then 'public'
        else quote_ident(rol)
      end,
      ', '
    )
    into v_roles
    from unnest(v_politica.roles) as rol;

    v_sql := format(
      'create policy %I on public.%I as %s for %s to %s',
      v_politica.policyname,
      v_politica.tablename,
      v_politica.permissive,
      v_politica.cmd,
      v_roles
    );

    if v_politica.qual is not null then
      v_sql := v_sql || ' using (' || v_politica.qual || ')';
    end if;

    if v_politica.with_check is not null then
      v_sql := v_sql || ' with check (' || v_politica.with_check || ')';
    end if;

    execute v_sql;
  end loop;
end
$$;

-- 3. Quitar los permisos por columna agregados en la Fase 0.
revoke update (status, note, updated_at)
  on public.assignments from authenticated;
revoke insert (assignment_id, item, completed, completed_at)
  on public.assignment_checklist from authenticated;
revoke update (completed, completed_at, updated_at)
  on public.assignment_checklist from authenticated;

-- 4. Restaurar los permisos de tabla originales.
revoke all on
  public.profiles, public.servers, public.assignments,
  public.service_assignments, public.assignment_checklist,
  public.service_teams, public.service_plans
from anon, authenticated;

do $$
declare
  v_permiso record;
begin
  for v_permiso in
    select * from fase0_respaldo.permisos_tabla
  loop
    execute format(
      'grant %s on public.%I to %I',
      v_permiso.privilege_type,
      v_permiso.table_name,
      v_permiso.grantee
    );
  end loop;
end
$$;

-- 5. Restaurar el estado de RLS original.
do $$
declare
  v_estado record;
begin
  for v_estado in
    select * from fase0_respaldo.rls_estado
  loop
    if v_estado.rls_activo then
      execute format('alter table public.%I enable row level security', v_estado.tabla);
    else
      execute format('alter table public.%I disable row level security', v_estado.tabla);
    end if;
  end loop;
end
$$;

-- 6. Quitar las funciones auxiliares de la Fase 0.
drop function if exists app_private.es_directivo();
drop function if exists app_private.tiene_permiso(text[]);
drop function if exists app_private.mi_perfil_id();
drop function if exists app_private.es_mi_asignacion(uuid);
drop function if exists app_private.estoy_en_equipo(uuid);
drop function if exists app_private.estoy_en_servicio(uuid);

-- 7. Renombrar el respaldo para permitir volver a aplicar 02 si se desea.
alter schema fase0_respaldo rename to fase0_respaldo_revertido;

commit;
