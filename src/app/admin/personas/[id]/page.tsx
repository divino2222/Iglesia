import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";

import { requirePermission } from "@/lib/auth/permissions";
import {
  getPersonDetail,
  type PersonActivity,
  type PersonAssignment,
} from "@/lib/person-details";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date?: string | null) {
  if (!date) {
    return "Sin registro";
  }

  return new Date(date).toLocaleDateString("es-MX", {
    dateStyle: "medium",
    timeZone: "America/Mexico_City",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) {
    return "Sin registro";
  }

  return new Date(date).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getAssignmentStatusLabel(status: string) {
  if (status === "confirmed") {
    return "Confirmado";
  }

  if (status === "change_requested") {
    return "Cambio solicitado";
  }

  return "Pendiente";
}

function getAssignmentStatusClasses(status: string) {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "change_requested") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getActivityIcon(action: string) {
  if (
    action === "confirmed_service" ||
    action === "admin_confirmed_assignment" ||
    action === "replacement_confirmed"
  ) {
    return {
      icon: <CheckCircle2 size={18} />,
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  if (
    action === "requested_change" ||
    action === "reopened_change_request"
  ) {
    return {
      icon: <MessageCircle size={18} />,
      className: "bg-amber-100 text-amber-700",
    };
  }

  if (
    action === "updated_members" ||
    action === "resolved_change_request"
  ) {
    return {
      icon: <UsersRound size={18} />,
      className: "bg-sky-100 text-sky-700",
    };
  }

  return {
    icon: <Activity size={18} />,
    className: "bg-stone-100 text-stone-700",
  };
}

export default async function PersonDetailPage({
  params,
}: PageProps) {
  await requirePermission("users.view");

  const { id } = await params;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  const person = await getPersonDetail(id);

  if (!person) {
    notFound();
  }

  const {
    profile,
    assignments,
    activities,
    stats,
  } = person;

  const allMinistries = Array.from(
    new Set([
      ...profile.ministries,
      ...profile.ministryScope,
    ])
  );

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft size={17} />
          Volver a usuarios
        </Link>

        <section className="overflow-hidden rounded-[38px] bg-stone-950 text-white shadow-sm">
          <div className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[30px] bg-white/10 bg-cover bg-center text-2xl font-bold"
                style={
                  profile.photoUrl
                    ? {
                        backgroundImage: `url(${profile.photoUrl})`,
                      }
                    : undefined
                }
              >
                {!profile.photoUrl
                  ? getInitials(profile.fullName)
                  : null}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
                  Centro de Personas
                </p>

                <h1 className="mt-2 truncate text-4xl font-semibold tracking-tight">
                  {profile.fullName}
                </h1>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    <ShieldCheck size={14} />
                    {profile.role?.label || "Sin rol asignado"}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      profile.isActive
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-red-500/20 text-red-200"
                    }`}
                  >
                    {profile.isActive ? (
                      <UserRoundCheck size={14} />
                    ) : (
                      <UserRoundX size={14} />
                    )}

                    {profile.isActive ? "Activo" : "Inactivo"}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      profile.authUserId
                        ? "bg-sky-500/20 text-sky-200"
                        : "bg-amber-500/20 text-amber-200"
                    }`}
                  >
                    <BadgeCheck size={14} />

                    {profile.authUserId
                      ? "Cuenta vinculada"
                      : "Sin cuenta"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoBlock
                icon={<Mail size={17} />}
                label="Correo"
                value={profile.email || "Sin correo"}
              />

              <InfoBlock
                icon={<Phone size={17} />}
                label="Teléfono"
                value={profile.phone || "Sin teléfono"}
              />

              <InfoBlock
                icon={<CalendarDays size={17} />}
                label="Registro"
                value={formatDate(profile.createdAt)}
              />

              <InfoBlock
                icon={<Clock3 size={17} />}
                label="Última actividad"
                value={formatDateTime(
                  stats.lastParticipationAt
                )}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatCard
            value={stats.totalAssignments}
            label="Asignaciones"
          />

          <StatCard
            value={stats.confirmed}
            label="Confirmadas"
          />

          <StatCard
            value={stats.pending}
            label="Pendientes"
          />

          <StatCard
            value={stats.changeRequests}
            label="Cambios"
          />

          <StatCard
            value={stats.resolvedChanges}
            label="Resueltos"
          />

          <StatCard
            value={stats.replacementAssignments}
            label="Reemplazos"
          />

          <StatCard
            value={`${stats.confirmationRate}%`}
            label="Confirmación"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                    Perfil
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                    Datos generales
                  </h2>
                </div>

                <UserRound
                  size={22}
                  className="text-stone-400"
                />
              </div>

              <div className="mt-5 space-y-4">
                <DetailRow
                  label="Nombre"
                  value={profile.fullName}
                />

                <DetailRow
                  label="Rol"
                  value={
                    profile.role?.label ||
                    "Sin rol asignado"
                  }
                />

                <DetailRow
                  label="Correo"
                  value={
                    profile.email ||
                    "Sin correo registrado"
                  }
                />

                <DetailRow
                  label="Teléfono"
                  value={
                    profile.phone ||
                    "Sin teléfono registrado"
                  }
                />

                <DetailRow
                  label="Estado"
                  value={
                    profile.isActive
                      ? "Activo"
                      : "Inactivo"
                  }
                />

                <DetailRow
                  label="Cuenta"
                  value={
                    profile.authUserId
                      ? "Vinculada con Authentication"
                      : "Sin cuenta vinculada"
                  }
                />
              </div>
            </section>

            <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                    Ministerios
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                    Participación
                  </h2>
                </div>

                <UsersRound
                  size={22}
                  className="text-stone-400"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {allMinistries.length > 0 ? (
                  allMinistries.map((ministry) => (
                    <span
                      key={ministry}
                      className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700"
                    >
                      {ministry}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-stone-500">
                    No tiene ministerios asignados.
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                  Servicios
                </p>

                <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                  Historial de asignaciones
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  {assignments.length} movimientos registrados
                </p>
              </div>

              <CalendarDays
                size={22}
                className="text-stone-400"
              />
            </div>

            {assignments.length === 0 ? (
              <EmptyState
                title="Sin asignaciones"
                description="Esta persona todavía no tiene servicios registrados."
              />
            ) : (
              <div className="mt-5 space-y-3">
                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                  />
                ))}
              </div>
            )}
          </section>
        </section>

        <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                Actividad
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-stone-950">
                Historial completo
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Últimos {activities.length} movimientos
              </p>
            </div>

            <Activity
              size={22}
              className="text-stone-400"
            />
          </div>

          {activities.length === 0 ? (
            <EmptyState
              title="Sin actividad"
              description="Todavía no hay movimientos registrados para esta persona."
            />
          ) : (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                />
              ))}
            </div>
          )}
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
      <div className="text-white/60">
        {icon}
      </div>

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-[26px] border border-stone-200 bg-white p-4 text-center shadow-sm">
      <p className="text-3xl font-bold text-stone-950">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-stone-400 sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] bg-stone-50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-stone-950">
        {value}
      </p>
    </div>
  );
}

function AssignmentCard({
  assignment,
}: {
  assignment: PersonAssignment;
}) {
  return (
    <article className="rounded-[24px] border border-stone-100 bg-stone-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-950">
            {assignment.teamEmoji || "🤝"}{" "}
            {assignment.teamName}
          </p>

          <p className="mt-1 text-xs text-stone-500">
            {assignment.serviceTitle ||
              "Servicio"}{" "}
            ·{" "}
            {assignment.serviceDate
              ? formatDate(
                  assignment.serviceDate
                )
              : "Sin fecha"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${getAssignmentStatusClasses(
            assignment.status
          )}`}
        >
          {getAssignmentStatusLabel(
            assignment.status
          )}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniDetail
          label="Rol"
          value={assignment.role}
        />

        <MiniDetail
          label="Hora"
          value={
            assignment.serviceTime ||
            "Sin hora"
          }
        />
      </div>

      {assignment.note ? (
        <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs leading-5 text-stone-600">
          {assignment.note}
        </p>
      ) : null}

      {assignment.resolutionNote ? (
        <p className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
          Resolución:{" "}
          {assignment.resolutionNote}
        </p>
      ) : null}
    </article>
  );
}

function ActivityCard({
  activity,
}: {
  activity: PersonActivity;
}) {
  const style = getActivityIcon(
    activity.action
  );

  return (
    <article className="rounded-[24px] border border-stone-100 bg-stone-50 p-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${style.className}`}
        >
          {style.icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5 text-stone-950">
            {activity.description}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
            <span>
              {formatDateTime(
                activity.createdAt
              )}
            </span>

            {activity.actorName ? (
              <span>
                Por {activity.actorName}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function MiniDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-stone-700">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-5">
      <p className="text-sm font-semibold text-stone-700">
        {title}
      </p>

      <p className="mt-1 text-sm leading-6 text-stone-500">
        {description}
      </p>
    </div>
  );
}