import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Mail,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import LogoutButton from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function MiCuentaPage() {
  const supabase = await createClient();

  /* =========================================================
     USUARIO AUTENTICADO
  ========================================================= */

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  /* =========================================================
     PERFIL VINCULADO
     IMPORTANTE:
     Ahora usamos profiles, NO servers.
  ========================================================= */

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      phone,
      photo_url,
      ministries,
      is_active,
      auth_user_id,
      email
      `
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `No se pudo cargar tu perfil: ${profileError.message}`
    );
  }

  /* =========================================================
     NOMBRE A MOSTRAR
  ========================================================= */

  const fullName =
    profile?.full_name ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ||
    user.email?.split("@")[0] ||
    "Miembro de Comunidad VID";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-5 px-4 py-6">
      {/* =====================================================
          CABECERA
      ====================================================== */}

      <section className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 px-5 py-7 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
            Mi Comunidad
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Hola, {fullName}
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/70">
            Este es tu espacio personal dentro de Comunidad VID.
          </p>
        </div>

        <div className="space-y-3 p-5">
          {/* NOMBRE */}

          <div className="flex items-center gap-3 rounded-[26px] border border-stone-100 bg-stone-50 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-800 shadow-sm">
              <UserRound size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                Cuenta
              </p>

              <p className="mt-1 truncate font-semibold text-stone-950">
                {fullName}
              </p>
            </div>
          </div>

          {/* CORREO */}

          <div className="flex items-center gap-3 rounded-[26px] border border-stone-100 bg-stone-50 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-800 shadow-sm">
              <Mail size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                Correo
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-stone-950">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PERFIL VINCULADO
      ====================================================== */}

      {profile ? (
        <section className="rounded-[34px] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
              <CheckCircle2 size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Perfil vinculado
              </p>

              <h2 className="mt-1 text-xl font-semibold text-stone-950">
                Servidor de Comunidad VID
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                Tu cuenta ya está relacionada con tu perfil de servicio.
              </p>

              {profile.ministries?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.ministries.map((ministry: string) => (
                    <span
                      key={ministry}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm"
                    >
                      {ministry}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        /* ===================================================
           PERFIL NO VINCULADO
        =================================================== */

        <section className="rounded-[34px] border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700">
              <UsersRound size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-stone-950">
                Tu cuenta todavía no está vinculada como servidor
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                Ya puedes usar tu cuenta. Cuando un coordinador vincule tu
                perfil, aquí aparecerán automáticamente tus asignaciones.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          MI SERVICIO
      ====================================================== */}

      {profile ? (
        <Link
          href="/mi-servicio"
          className="group block rounded-[30px] border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-200"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-emerald-100 text-emerald-700">
              <ShieldCheck size={24} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Servidores
              </p>

              <h2 className="mt-1 text-lg font-semibold text-stone-950">
                Mi servicio
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Consulta tu próxima asignación, horario y equipo.
              </p>
            </div>

            <span className="text-xl text-stone-400 transition group-hover:translate-x-1">
              →
            </span>
          </div>
        </Link>
      ) : null}

      {/* =====================================================
          PLAN GENERAL
      ====================================================== */}

      <Link
        href="/servir"
        className="flex items-center justify-between rounded-[26px] border border-stone-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
            <CalendarDays size={19} />
          </div>

          <div>
            <p className="font-semibold text-stone-950">
              Plan de servidores
            </p>

            <p className="text-xs text-stone-500">
              Consulta la organización del domingo
            </p>
          </div>
        </div>

        <span className="text-stone-400">→</span>
      </Link>

      {/* =====================================================
          CERRAR SESIÓN
      ====================================================== */}

      <LogoutButton />
    </div>
  );
}