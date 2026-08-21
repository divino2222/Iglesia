import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  LayoutDashboard,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";

import ActivityFeed from "@/components/admin/activity-feed";
import AdminNotificationListener from "@/components/admin/admin-notification-listener";
import ChangeRequestCenter from "@/components/admin/change-request-center";
import DashboardRealtime from "@/components/admin/dashboard-realtime";
import NotificationHistory, {
  type NotificationHistoryRow,
} from "@/components/admin/notification-history";
import PushNotificationManager from "@/components/admin/push-notification-manager";
import ServiceReadiness from "@/components/admin/service-readiness";
import SmartTeamCards from "@/components/admin/smart-team-cards";

import { requirePermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServingAdminData } from "@/lib/serving-admin";

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return localDate.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusLabel(status?: string) {
  if (status === "confirmed") return "Confirmó";
  if (status === "change_requested") return "Pidió cambio";

  return "Pendiente";
}

function teamStatusLabel(status?: string) {
  if (status === "ready") return "Listo";
  if (status === "attention") return "Revisar";

  return "Pendiente";
}

export default async function AdminDashboardPage() {
  await requirePermission("dashboard.view");

  const { plan, teams, assignments, profiles, activities } =
    await getServingAdminData();

  if (!plan) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-4 py-8">
        <section className="mx-auto max-w-md rounded-[34px] border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-stone-950">
            Sin servicio próximo
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Todavía no hay un plan de servicio creado.
          </p>
        </section>
      </main>
    );
  }

  /*
   * Consultamos las últimas notificaciones del servicio seleccionado.
   */
  const admin = createAdminClient();

  const {
    data: notificationsData,
    error: notificationsError,
  } = await admin
    .from("notification_queue")
    .select(`
      id,
      type,
      service_plan_id,
      assignment_id,
      recipient,
      title,
      body,
      sent,
      sent_at,
      created_at
    `)
    .eq("service_plan_id", plan.id)
    .eq("recipient", "admin")
    .order("created_at", { ascending: false })
    .limit(12);

  if (notificationsError) {
    console.error(
      "No se pudo consultar el historial de notificaciones:",
      notificationsError.message
    );
  }

  const notifications =
    (notificationsData ?? []) as NotificationHistoryRow[];

  /*
   * Relacionamos nombres con perfiles porque service_teams todavía guarda
   * responsable e integrantes por nombre.
   */
  const profileByName = new Map(
    profiles.map((profile) => [profile.full_name, profile])
  );

  /*
   * Respuesta registrada por persona y equipo.
   */
  const responseByProfileTeam = new Map(
    assignments.map((assignment) => [
      `${assignment.profile_id}-${assignment.team_id}`,
      assignment,
    ])
  );

  /*
   * Construye la lista real de personas que deberían responder.
   * Incluye al responsable y a los integrantes, evitando nombres duplicados.
   */
  const expectedAssignments = teams.flatMap((team) => {
    const assignedNames = Array.from(
      new Set(
        [team.leader_name, ...(team.members ?? [])].filter(
          (name): name is string => Boolean(name)
        )
      )
    );

    return assignedNames.flatMap((name) => {
      const profile = profileByName.get(name);

      if (!profile) {
        return [];
      }

      const response = responseByProfileTeam.get(
        `${profile.id}-${team.id}`
      );

      return [
        {
          team,
          profile,
          response,
          status: response?.status ?? "pending",
        },
      ];
    });
  });

  const confirmed = expectedAssignments.filter(
    (item) => item.status === "confirmed"
  );

  const changes = expectedAssignments.filter(
    (item) => item.status === "change_requested"
  );

  const pending = expectedAssignments.filter(
    (item) => item.status === "pending"
  );

  const totalMembers = teams.reduce((total, team) => {
    const names = new Set(
      [team.leader_name, ...(team.members ?? [])].filter(
        (name): name is string => Boolean(name)
      )
    );

    return total + names.size;
  }, 0);

  const readyTeams = teams.filter(
    (team) => team.status === "ready"
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-[38px] bg-stone-950 text-white shadow-sm">
          <div className="p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
              <LayoutDashboard size={14} />
              Comunidad VID
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Centro de Operaciones
            </h1>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoBlock
                icon={<CalendarDays size={18} />}
                label="Servicio"
                value={formatDate(plan.service_date)}
              />

              <InfoBlock
                icon={<Clock3 size={18} />}
                label="Hora"
                value={plan.service_time}
              />

              <InfoBlock
                icon={<CheckCircle2 size={18} />}
                label="Estado"
                value={teamStatusLabel(plan.status)}
              />
            </div>

            {plan.theme || plan.preacher ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {plan.theme ? (
                  <InfoBlock
                    icon={<Activity size={18} />}
                    label="Tema"
                    value={plan.theme}
                  />
                ) : null}

                {plan.preacher ? (
                  <InfoBlock
                    icon={<UserRound size={18} />}
                    label="Predicador"
                    value={plan.preacher}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <DashboardRealtime servicePlanId={plan.id} />

        <AdminNotificationListener servicePlanId={plan.id} />

        <PushNotificationManager />

<section className="grid grid-cols-3 gap-3">
          <Metric
            number={confirmed.length}
            label="Confirmados"
            color="green"
          />

          <Metric
            number={pending.length}
            label="Pendientes"
            color="yellow"
          />

          <Metric
            number={changes.length}
            label="Cambios"
            color="red"
          />
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Equipos" value={teams.length} />

          <MiniStat
            label="Equipos listos"
            value={`${readyTeams}/${teams.length}`}
          />

          <MiniStat label="Asignaciones" value={totalMembers} />

          <MiniStat label="Personas" value={profiles.length} />
        </section>

        <ServiceReadiness
          teams={teams}
          profiles={profiles}
          assignments={assignments}
        />

        <ChangeRequestCenter
          assignments={assignments}
          profiles={profiles}
          teams={teams}
        />

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Atención inmediata
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            Solicitudes y pendientes
          </h2>

          <div className="mt-4 space-y-3">
            {changes.length === 0 && pending.length === 0 ? (
              <div className="rounded-[26px] border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className="shrink-0 text-emerald-700"
                    size={22}
                  />

                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Todo está tranquilo
                    </p>

                    <p className="mt-1 text-sm leading-6 text-emerald-700">
                      Todas las personas asignadas han respondido y no hay
                      solicitudes de cambio.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {[...changes, ...pending].slice(0, 8).map((item) => (
              <div
                key={`${item.profile.id}-${item.team.id}`}
                className="rounded-[26px] border border-stone-100 bg-stone-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        item.status === "change_requested"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status === "change_requested" ? (
                        <AlertTriangle size={20} />
                      ) : (
                        <UserRound size={20} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-950">
                        {item.profile.full_name}
                      </p>

                      <p className="text-xs text-stone-500">
                        {item.team.emoji || "🤝"}{" "}
                        {item.team.team_name} ·{" "}
                        {statusLabel(item.status)}
                      </p>
                    </div>
                  </div>

                  {item.response?.id ? (
                    <Link
                      href={`/admin/assignment/${item.response.id}`}
                      className="shrink-0 rounded-full bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800"
                    >
                      Revisar
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/servir?plan=${plan.id}`}
                      className="shrink-0 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-200"
                    >
                      Administrar
                    </Link>
                  )}
                </div>

                {item.response?.note ? (
                  <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs leading-5 text-stone-600">
                    “{item.response.note}”
                  </p>
                ) : null}
              </div>
            ))}

            {changes.length + pending.length > 8 ? (
              <Link
                href={`/admin/servir?plan=${plan.id}`}
                className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-sm font-semibold text-stone-700"
              >
                Ver todos los pendientes
              </Link>
            ) : null}
          </div>
        </section>

        <ActivityFeed activities={activities} />

        <NotificationHistory
          notifications={notifications}
        />

        <SmartTeamCards
          teams={teams}
          profiles={profiles}
          assignments={assignments}
          planId={plan.id}
        />

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickLink
            href={`/admin/servir?plan=${plan.id}`}
            label="Administrar"
            icon={<Settings size={22} />}
          />

          <QuickLink
            href="/admin/personas"
            label="Personas"
            icon={<UsersRound size={22} />}
          />

          <QuickLink
            href="/eventos"
            label="Eventos"
            icon={<Calendar size={22} />}
          />

          <QuickLink
            href="/servir"
            label="Vista pública"
            icon={<Eye size={22} />}
          />
        </section>
      </div>
    </main>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] bg-white/10 p-4">
      <div className="text-white/60">{icon}</div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold capitalize text-white">
        {value}
      </p>
    </div>
  );
}

function Metric({
  number,
  label,
  color,
}: {
  number: number;
  label: string;
  color: "green" | "yellow" | "red";
}) {
  const classes = {
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div
      className={`rounded-[28px] p-4 text-center ${classes[color]}`}
    >
      <p className="text-3xl font-bold">{number}</p>

      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] sm:text-[11px] sm:tracking-[0.16em]">
        {label}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[26px] border border-stone-200 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-bold text-stone-950">
        {value}
      </p>

      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 sm:text-[11px] sm:tracking-[0.16em]">
        {label}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 rounded-[28px] bg-stone-950 px-5 py-5 text-center text-sm font-semibold text-white transition hover:bg-stone-800"
    >
      {icon}
      {label}
    </Link>
  );
}