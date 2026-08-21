import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { confirmAssignment } from "../actions";

type PageProps = {
  searchParams?: Promise<{
    id?: string;
  }>;
};

function formatDate(dateValue: string) {
  const [year, month, day] =
    dateValue.split("-").map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ConfirmarServicioPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const assignmentId = params?.id;

  if (!assignmentId) {
    redirect("/mi-servicio");
  }

  const supabase = await createClient();

  /* =========================================================
     USUARIO
  ========================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /* =========================================================
     PERFIL
  ========================================================= */

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/mi-cuenta");
  }

  /* =========================================================
     ASIGNACIÓN
  ========================================================= */

  const {
    data: assignment,
    error: assignmentError,
  } = await supabase
    .from("assignments")
    .select(
      `
      id,
      status,
      profile_id,

      service_plans (
        service_date,
        title,
        service_time
      ),

      service_teams (
        team_name,
        emoji,
        arrival_time
      )
      `
    )
    .eq("id", assignmentId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (assignmentError || !assignment) {
    redirect("/mi-servicio");
  }

  const plan = Array.isArray(
    assignment.service_plans
  )
    ? assignment.service_plans[0]
    : assignment.service_plans;

  const team = Array.isArray(
    assignment.service_teams
  )
    ? assignment.service_teams[0]
    : assignment.service_teams;

  return (
    <div className="space-y-5 px-4 py-6 pb-28">
      <section className="overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        {/* CABECERA */}

        <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 px-5 py-7 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <ShieldCheck size={13} />
            Mi servicio
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Confirmar asistencia
          </h1>

          <p className="mt-2 text-sm leading-6 text-emerald-50">
            Confirma que estarás presente en tu próximo servicio.
          </p>
        </div>

        <div className="space-y-4 p-5">
          {/* PERSONA */}

          <div className="rounded-[26px] border border-stone-100 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              Servidor
            </p>

            <p className="mt-1 text-lg font-semibold text-stone-950">
              {profile.full_name}
            </p>
          </div>

          {/* FECHA */}

          {plan ? (
            <div className="rounded-[26px] border border-stone-100 bg-white p-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100">
                  <CalendarDays size={19} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Servicio
                  </p>

                  <p className="mt-1 font-semibold text-stone-950">
                    {formatDate(
                      plan.service_date
                    )}
                  </p>

                  <p className="mt-1 text-sm text-stone-500">
                    {plan.title} ·{" "}
                    {plan.service_time}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* EQUIPO */}

          {team ? (
            <div className="rounded-[26px] border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Equipo
              </p>

              <p className="mt-1 text-xl font-semibold text-stone-950">
                {team.emoji || "🤝"}{" "}
                {team.team_name}
              </p>

              {team.arrival_time ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                  <Clock3 size={15} />

                  Llegada:{" "}
                  {team.arrival_time}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* YA CONFIRMADO */}

          {assignment.status ===
          "confirmed" ? (
            <div className="flex items-center gap-3 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <CheckCircle2
                size={21}
                className="shrink-0"
              />

              <div>
                <p className="font-semibold">
                  Ya confirmaste tu asistencia
                </p>

                <p className="mt-1 text-sm">
                  Coordinación ya puede ver tu confirmación.
                </p>
              </div>
            </div>
          ) : (
            <form
              action={confirmAssignment}
              className="space-y-3"
            >
              <input
                type="hidden"
                name="assignment_id"
                value={assignment.id}
              />

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
              >
                <CheckCircle2 size={18} />

                Sí, confirmo que asistiré
              </button>
            </form>
          )}

          <Link
            href="/mi-servicio"
            className="flex w-full items-center justify-center rounded-[22px] border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-stone-700"
          >
            Volver
          </Link>
        </div>
      </section>
    </div>
  );
}