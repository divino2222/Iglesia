-- =====================================================================
-- Operación única · Limpieza de datos de prueba
--
-- Deja la base solo con la cuenta maestra (admin) y el contenido de la
-- iglesia. NO es una migración: no va en supabase/migrations porque no
-- debe ejecutarse en bases nuevas.
--
-- Se BORRA:
--   · Todas las cuentas de auth.users menos la maestra.
--   · Todos los perfiles menos el de la cuenta maestra.
--   · Datos operativos de prueba: servicios, equipos, asignaciones,
--     checklist, cola y bandeja de notificaciones, bitácora,
--     solicitudes para servir, peticiones de oración y mensajes de
--     contacto.
--   · Suscripciones push de otras cuentas (las tuyas se conservan).
--   · Las "Noche de oración" repetidas (se conserva la de menor id).
--   · Contenido de las tablas *_legacy (se borran en el Paso 6).
--
-- Se CONSERVA:
--   · roles, permissions, role_permissions, ministries, church_info,
--     el resto de events, sermons, announcements.
--
-- Uso:
--   1. Ejecutar tal cual (v_aplicar = false): simula, muestra lo que
--      borraría y deshace todo (termina con un error "SIMULACIÓN").
--   2. Revisar los números. Cambiar v_aplicar a true y ejecutar de
--      nuevo para aplicar.
--
-- Las fotos de perfil en Storage (bucket "media") no se borran aquí:
-- revisarlas a mano en el panel de Storage.
-- =====================================================================

do $$
declare
  -- ⚙️ Configuración
  v_aplicar      boolean := false;
  v_master_email text    := 'alantox10@hotmail.com';

  v_master_auth    uuid;
  v_master_profile uuid;
  v_master_role    text;
  v_n              int;
  v_resumen        text := '';
  v_t              text;
begin
  -- -------------------------------------------------------------------
  -- 0) Identificar la cuenta maestra (por auth_user_id, no por correo)
  -- -------------------------------------------------------------------
  select id into v_master_auth
  from auth.users
  where lower(email) = lower(v_master_email);

  if v_master_auth is null then
    raise exception 'No existe la cuenta % en auth.users', v_master_email;
  end if;

  select p.id, r.name into v_master_profile, v_master_role
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.auth_user_id = v_master_auth;

  if v_master_profile is null then
    raise exception 'La cuenta % no tiene perfil vinculado por auth_user_id', v_master_email;
  end if;

  if v_master_role <> 'admin' then
    raise exception 'El perfil maestro tiene rol "%", se esperaba "admin"', v_master_role;
  end if;

  -- -------------------------------------------------------------------
  -- 1) Datos operativos (hijos antes que padres)
  -- -------------------------------------------------------------------
  foreach v_t in array array[
    'assignment_checklist',
    'notification_queue',
    'service_assignments',
    'assignments_legacy',
    'activity_log',
    'service_teams',
    'service_plans',
    'ministry_requests',
    'user_notifications',
    'servers_legacy',
    'prayer_requests',
    'contact_messages'
  ] loop
    if to_regclass('public.' || v_t) is not null then
      execute format('delete from public.%I', v_t);
      get diagnostics v_n = row_count;
      v_resumen := v_resumen || format(E'\n  %s: %s', v_t, v_n);
    end if;
  end loop;

  delete from public.push_subscriptions
  where auth_user_id is distinct from v_master_auth;
  get diagnostics v_n = row_count;
  v_resumen := v_resumen || format(E'\n  push_subscriptions (otras cuentas): %s', v_n);

  -- Rotación de prueba de "Noche de oración": se conserva la más antigua
  delete from public.events
  where title = 'Noche de oración'
    and id <> (select min(id) from public.events where title = 'Noche de oración');
  get diagnostics v_n = row_count;
  v_resumen := v_resumen || format(E'\n  events (Noche de oración repetidas): %s', v_n);

  -- -------------------------------------------------------------------
  -- 2) Perfiles y cuentas
  -- -------------------------------------------------------------------
  delete from public.profiles where id <> v_master_profile;
  get diagnostics v_n = row_count;
  v_resumen := v_resumen || format(E'\n  profiles: %s', v_n);

  delete from auth.users where id <> v_master_auth;
  get diagnostics v_n = row_count;
  v_resumen := v_resumen || format(E'\n  auth.users: %s', v_n);

  update public.profiles
  set is_active = true
  where id = v_master_profile;

  -- -------------------------------------------------------------------
  -- 3) Verificación
  -- -------------------------------------------------------------------
  if (select count(*) from public.profiles) <> 1
     or (select count(*) from auth.users) <> 1
     or not exists (select 1 from public.profiles
                    where id = v_master_profile
                      and auth_user_id = v_master_auth
                      and is_active) then
    raise exception 'La verificación final falló; no se aplicó nada';
  end if;

  if not v_aplicar then
    raise exception E'SIMULACIÓN (no se borró nada). Se borrarían:%\n\nCambia v_aplicar a true para aplicar.', v_resumen;
  end if;

  raise notice E'Limpieza aplicada. Filas borradas:%', v_resumen;
end
$$;

-- Estado final (solo se ve si se aplicó)
select p.id as profile_id, p.full_name, p.email, p.auth_user_id, r.name as rol, p.is_active
from public.profiles p
join public.roles r on r.id = p.role_id;
