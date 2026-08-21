import Link from "next/link";

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getCurrentUser,
} from "@/lib/auth/current-user";

import {
  formatAppDate,
  getAppTodayString,
  getDaysUntil,
  hasServiceStarted,
} from "@/lib/date-time";

type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "change_requested";

/* =========================================================
   ESTADO
========================================================= */

function getStatusLabel(
  status: AssignmentStatus
) {
  if (
    status === "confirmed"
  ) {
    return "Asistencia confirmada";
  }

  if (
    status ===
    "change_requested"
  ) {
    return "Esperando respuesta de coordinación";
  }

  return "Necesita tu respuesta";
}

function getStatusDescription(
  status: AssignmentStatus
) {
  if (
    status === "confirmed"
  ) {
    return "Tu asistencia está registrada para este servicio.";
  }

  if (
    status ===
    "change_requested"
  ) {
    return "Tu solicitud de cambio fue enviada. Coordinación la revisará.";
  }

  return "Confirma tu asistencia o solicita un cambio para que coordinación pueda organizar el equipo.";
}

function getStatusClasses(
  status: AssignmentStatus
) {
  if (
    status === "confirmed"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    status ===
    "change_requested"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

/* =========================================================
   CONTEXTO DEL SERVICIO
========================================================= */

function getServiceContext(
  serviceDate: string
) {
  const daysAway =
    getDaysUntil(
      serviceDate
    );

  if (daysAway === 0) {
    return {
      eyebrow:
        "Mi servicio de hoy",

      title:
        "Hoy sirves 🙌",

      subtitle:
        "Tu servicio es hoy. Revisa tu hora de llegada y deja lista tu preparación.",

      highlight: true,
    };
  }

  if (daysAway === 1) {
    return {
      eyebrow:
        "Mi próximo servicio",

      title:
        "Mañana sirves",

      subtitle:
        "Tu servicio es mañana. Revisa tu horario y termina tu preparación.",

      highlight: true,
    };
  }

  if (
    daysAway > 1 &&
    daysAway <= 3
  ) {
    return {
      eyebrow:
        "Mi próximo servicio",

      title:
        `Faltan ${daysAway} días`,

      subtitle:
        "Tu servicio está cerca. Revisa tu asignación y completa tu preparación.",

      highlight: false,
    };
  }

  return {
    eyebrow:
      "Mi próximo servicio",

    title:
      "Tu próximo servicio",

    subtitle:
      "Aquí tienes lo más importante para tu próxima asignación.",

    highlight: false,
  };
}

/* =========================================================
   COMPONENTE
========================================================= */

export default async function MyNextServiceCard() {
  /*
   * IMPORTANTE:
   *
   * getCurrentUser() está cacheado.
   * Si HomePriorityStack ya consultó al usuario,
   * aquí reutilizamos el resultado durante
   * este mismo render.
   */
  const user =
    await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase =
    await createClient();

  /* =======================================================
     PERFIL
  ======================================================= */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      auth_user_id
      `
    )
    .eq(
      "auth_user_id",
      user.id
    )
    .maybeSingle();

  if (
    profileError ||
    !profile
  ) {
    return null;
  }

  /* =======================================================
     ASIGNACIONES
  ======================================================= */

  const {
    data: assignments,
    error:
      assignmentsError,
  } = await supabase
    .from("assignments")
    .select(
      `
      id,
      status,
      note,
      service_plan_id,
      team_id,

      service_plans (
        id,
        service_date,
        title,
        service_time,
        location
      ),

      service_teams (
        id,
        team_name,
        emoji,
        leader_name,
        arrival_time,
        service_time,
        checklist
      )
      `
    )
    .eq(
      "profile_id",
      profile.id
    );

  if (
    assignmentsError
  ) {
    return null;
  }

  const today =
    getAppTodayString();

  /* =======================================================
     PRÓXIMA ASIGNACIÓN
  ======================================================= */

  const futureAssignments =
    (
      assignments ?? []
    )
      .filter(
        (assignment) => {
          const plan =
            Array.isArray(
              assignment.service_plans
            )
              ? assignment
                  .service_plans[0]
              : assignment
                  .service_plans;

          return (
            plan?.service_date &&
            plan.service_date >=
              today
          );
        }
      )
      .sort(
        (a, b) => {
          const planA =
            Array.isArray(
              a.service_plans
            )
              ? a
                  .service_plans[0]
              : a
                  .service_plans;

          const planB =
            Array.isArray(
              b.service_plans
            )
              ? b
                  .service_plans[0]
              : b
                  .service_plans;

          return String(
            planA?.service_date ||
              ""
          ).localeCompare(
            String(
              planB?.service_date ||
                ""
            )
          );
        }
      );

  const nextAssignment =
    futureAssignments[0];

  if (!nextAssignment) {
    return null;
  }

  /* =======================================================
     PLAN + EQUIPO
  ======================================================= */

  const plan =
    Array.isArray(
      nextAssignment.service_plans
    )
      ? nextAssignment
          .service_plans[0]
      : nextAssignment
          .service_plans;

  const team =
    Array.isArray(
      nextAssignment.service_teams
    )
      ? nextAssignment
          .service_teams[0]
      : nextAssignment
          .service_teams;

  if (
    !plan ||
    !team
  ) {
    return null;
  }

  const status =
    nextAssignment.status as AssignmentStatus;

  /* =======================================================
     CONTEXTO
  ======================================================= */

  const context =
    getServiceContext(
      plan.service_date
    );

  const daysAway =
    getDaysUntil(
      plan.service_date
    );

  const serviceStarted =
    hasServiceStarted({
      serviceDate:
        plan.service_date,

      serviceTime:
        team.service_time ||
        plan.service_time,
    });

  /* =======================================================
     CHECKLIST
  ======================================================= */

  const {
    data:
      checklistProgress,
  } = await supabase
    .from(
      "assignment_checklist"
    )
    .select(
      `
      item,
      completed
      `
    )
    .eq(
      "assignment_id",
      nextAssignment.id
    );

  const completedMap =
    new Map<
      string,
      boolean
    >(
      (
        checklistProgress ??
        []
      ).map(
        (row) => [
          row.item,
          Boolean(
            row.completed
          ),
        ]
      )
    );

  const checklistItems =
    team.checklist ?? [];

  const completedCount =
    checklistItems.filter(
      (item: string) =>
        completedMap.get(
          item
        ) === true
    ).length;

  const checklistTotal =
    checklistItems.length;

  const checklistPercentage =
    checklistTotal > 0
      ? Math.round(
          (
            completedCount /
            checklistTotal
          ) *
            100
        )
      : 0;

  const readyToServe =
    status ===
      "confirmed" &&
    checklistTotal > 0 &&
    completedCount ===
      checklistTotal;

  /* =======================================================
     TARJETA
  ======================================================= */

  return (
    <section
      className={`overflow-hidden rounded-[34px] border bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)] ${
        context.highlight
          ? "border-emerald-200"
          : "border-emerald-100"
      }`}
    >
      {/* CABECERA */}

      <div
        className={`px-5 py-6 text-white ${
          context.highlight
            ? "bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-500"
            : "bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              {context.highlight ? (
                <Sparkles
                  size={13}
                />
              ) : (
                <ShieldCheck
                  size={13}
                />
              )}

              {
                context.eyebrow
              }
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {
                context.title
              }
            </h2>

            <p className="mt-2 text-sm leading-6 text-emerald-50">
              {
                context.subtitle
              }
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
            {team.emoji ||
              "🤝"}
          </div>
        </div>
      </div>

      {/* CONTENIDO */}

      <div className="space-y-4 p-5">
        {/* EQUIPO */}

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Tu equipo
          </p>

          <h3 className="mt-1 text-2xl font-semibold text-stone-950">
            {
              team.team_name
            }
          </h3>

          {team.leader_name ? (
            <p className="mt-1 text-sm text-stone-500">
              Responsable:{" "}

              <span className="font-semibold text-stone-700">
                {
                  team.leader_name
                }
              </span>
            </p>
          ) : null}
        </div>

        {/* FECHA / LLEGADA */}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[22px] bg-stone-50 p-4">
            <CalendarDays
              size={18}
              className="text-stone-500"
            />

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              Fecha
            </p>

            <p className="mt-1 text-sm font-semibold capitalize text-stone-950">
              {formatAppDate(
                plan.service_date
              )}
            </p>
          </div>

          <div
            className={`rounded-[22px] p-4 ${
              daysAway === 0
                ? "bg-emerald-50"
                : "bg-stone-50"
            }`}
          >
            <Clock3
              size={18}
              className={
                daysAway === 0
                  ? "text-emerald-700"
                  : "text-stone-500"
              }
            />

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              Llegada
            </p>

            <p className="mt-1 text-sm font-semibold text-stone-950">
              {team.arrival_time ||
                "Por confirmar"}
            </p>
          </div>
        </div>

        {/* SERVICIO INICIADO */}

        {serviceStarted ? (
          <div className="rounded-[22px] border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            <p className="font-semibold">
              El servicio de hoy ya comenzó.
            </p>

            <p className="mt-1 text-xs leading-5">
              Tu información y checklist siguen disponibles durante el servicio.
            </p>
          </div>
        ) : null}

        {/* ESTADO */}

        <div
          className={`rounded-[22px] border px-4 py-4 ${getStatusClasses(
            status
          )}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {status ===
              "confirmed" ? (
                <CheckCircle2
                  size={19}
                />
              ) : status ===
                "change_requested" ? (
                <MessageCircle
                  size={19}
                />
              ) : (
                <Clock3
                  size={19}
                />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {getStatusLabel(
                  status
                )}
              </p>

              <p className="mt-1 text-xs leading-5 opacity-80">
                {getStatusDescription(
                  status
                )}
              </p>
            </div>
          </div>
        </div>

        {/* PREPARACIÓN */}

        {checklistTotal >
        0 ? (
          <div className="rounded-[24px] border border-stone-100 bg-stone-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Preparación
                </p>

                <p className="mt-1 text-sm font-semibold text-stone-950">
                  {completedCount}{" "}
                  de{" "}
                  {
                    checklistTotal
                  }{" "}
                  tareas
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  readyToServe
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-white text-stone-600"
                }`}
              >
                {
                  checklistPercentage
                }
                %
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${checklistPercentage}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        {/* LISTO */}

        {readyToServe ? (
          <div className="flex items-start gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Listo para servir
              </p>

              <p className="mt-1 text-xs leading-5">
                Confirmaste tu asistencia y completaste toda tu preparación.
              </p>
            </div>
          </div>
        ) : null}

        {/* CTA */}

        <Link
          href="/mi-servicio"
          className="flex w-full items-center justify-between rounded-[22px] bg-stone-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(0,0,0,0.14)]"
        >
          <span>
            {daysAway === 0
              ? "Abrir mi servicio de hoy"
              : status ===
                  "pending"
                ? "Revisar y confirmar"
                : status ===
                    "change_requested"
                  ? "Ver mi solicitud"
                  : "Ver mi servicio"}
          </span>

          <ChevronRight
            size={18}
          />
        </Link>
      </div>
    </section>
  );
}