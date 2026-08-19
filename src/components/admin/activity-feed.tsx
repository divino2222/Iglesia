import type { ActivityLogRow } from "@/lib/serving-admin";
import {
  Activity,
  CalendarPlus,
  CheckCircle2,
  ClipboardPenLine,
  RefreshCcw,
  RotateCcw,
  UserPlus,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

type ActivityFeedProps = {
  activities: ActivityLogRow[];
};

type ActivityStyle = {
  label: string;
  icon: React.ReactNode;
  iconClass: string;
  badgeClass: string;
};

function getActivityStyle(action: string): ActivityStyle {
  switch (action) {
    case "confirmed_service":
      return {
        label: "Confirmación",
        icon: <CheckCircle2 size={18} />,
        iconClass: "bg-emerald-100 text-emerald-700",
        badgeClass: "bg-emerald-100 text-emerald-700",
      };

    case "requested_change":
      return {
        label: "Cambio solicitado",
        icon: <RefreshCcw size={18} />,
        iconClass: "bg-amber-100 text-amber-700",
        badgeClass: "bg-amber-100 text-amber-700",
      };

    case "created_service_plan":
      return {
        label: "Nuevo servicio",
        icon: <CalendarPlus size={18} />,
        iconClass: "bg-sky-100 text-sky-700",
        badgeClass: "bg-sky-100 text-sky-700",
      };

    case "updated_service_plan":
      return {
        label: "Servicio actualizado",
        icon: <ClipboardPenLine size={18} />,
        iconClass: "bg-blue-100 text-blue-700",
        badgeClass: "bg-blue-100 text-blue-700",
      };

    case "assigned_leader":
      return {
        label: "Responsable asignado",
        icon: <UserRoundCog size={18} />,
        iconClass: "bg-violet-100 text-violet-700",
        badgeClass: "bg-violet-100 text-violet-700",
      };

    case "updated_members":
      return {
        label: "Integrantes",
        icon: <UsersRound size={18} />,
        iconClass: "bg-indigo-100 text-indigo-700",
        badgeClass: "bg-indigo-100 text-indigo-700",
      };

    case "updated_service_team":
      return {
        label: "Equipo actualizado",
        icon: <UsersRound size={18} />,
        iconClass: "bg-cyan-100 text-cyan-700",
        badgeClass: "bg-cyan-100 text-cyan-700",
      };

    case "created_profile":
      return {
        label: "Persona agregada",
        icon: <UserPlus size={18} />,
        iconClass: "bg-teal-100 text-teal-700",
        badgeClass: "bg-teal-100 text-teal-700",
      };

    case "updated_profile":
      return {
        label: "Persona actualizada",
        icon: <UserRoundCog size={18} />,
        iconClass: "bg-stone-200 text-stone-700",
        badgeClass: "bg-stone-200 text-stone-700",
      };

    case "resolved_change_request":
  return {
    label: "Cambio resuelto",
    icon: <CheckCircle2 size={18} />,
    iconClass: "bg-emerald-100 text-emerald-700",
    badgeClass: "bg-emerald-100 text-emerald-700",
  };

case "reopened_change_request":
  return {
    label: "Cambio reabierto",
    icon: <RotateCcw size={18} />,
    iconClass: "bg-red-100 text-red-700",
    badgeClass: "bg-red-100 text-red-700",
  };

    default:
      return {
        label: "Actividad",
        icon: <Activity size={18} />,
        iconClass: "bg-stone-100 text-stone-700",
        badgeClass: "bg-stone-100 text-stone-700",
      };
  }
}

function formatRelativeTime(date: string) {
  const activityDate = new Date(date);
  const now = new Date();

  const seconds = Math.max(
    0,
    Math.floor((now.getTime() - activityDate.getTime()) / 1000)
  );

  if (seconds < 60) {
    return "Hace unos segundos";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "Ayer";
  }

  if (days < 7) {
    return `Hace ${days} días`;
  }

  return activityDate.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: activityDate.getFullYear() !== now.getFullYear()
      ? "numeric"
      : undefined,
    timeZone: "America/Mexico_City",
  });
}

function getMetadataNote(metadata: Record<string, unknown> | null) {
  if (!metadata) return null;

  const note = metadata.note;

  return typeof note === "string" && note.trim() ? note.trim() : null;
}

function getMetadataSummary(metadata: Record<string, unknown> | null) {
  if (!metadata) return null;

  const changedFields = metadata.changed_fields;

  if (Array.isArray(changedFields) && changedFields.length > 0) {
    return `Cambios: ${changedFields.join(", ")}`;
  }

  const addedMembers = metadata.added_members;
  const removedMembers = metadata.removed_members;

  const summaries: string[] = [];

  if (Array.isArray(addedMembers) && addedMembers.length > 0) {
    summaries.push(`Agregados: ${addedMembers.join(", ")}`);
  }

  if (Array.isArray(removedMembers) && removedMembers.length > 0) {
    summaries.push(`Retirados: ${removedMembers.join(", ")}`);
  }

  return summaries.length > 0 ? summaries.join(" · ") : null;
}

export default function ActivityFeed({
  activities,
}: ActivityFeedProps) {
  return (
    <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Historial
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            Actividad reciente
          </h2>

          <p className="mt-1 text-sm leading-6 text-stone-500">
            Movimientos importantes del servicio y del equipo.
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
          <Activity size={20} />
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="mt-4 rounded-[26px] border border-stone-100 bg-stone-50 p-5">
          <p className="text-sm font-semibold text-stone-800">
            Todavía no hay actividad registrada
          </p>

          <p className="mt-1 text-sm leading-6 text-stone-500">
            Las confirmaciones, asignaciones y modificaciones aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="relative mt-5 space-y-3">
          <div className="absolute bottom-5 left-5 top-5 w-px bg-stone-200" />

          {activities.map((activity) => {
            const style = getActivityStyle(activity.action);
            const note = getMetadataNote(activity.metadata);
            const summary = getMetadataSummary(activity.metadata);

            return (
              <article
                key={activity.id}
                className="relative flex items-start gap-3 rounded-[24px] border border-stone-100 bg-stone-50 p-4"
              >
                <div
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${style.iconClass}`}
                >
                  {style.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-5 text-stone-950">
                        {activity.description}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-stone-400">
                          {formatRelativeTime(activity.created_at)}
                        </span>

                        {activity.actor_name ? (
                          <>
                            <span className="text-xs text-stone-300">•</span>

                            <span className="text-xs text-stone-500">
                              {activity.actor_name}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${style.badgeClass}`}
                    >
                      {style.label}
                    </span>
                  </div>

                  {summary ? (
                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-stone-600">
                      {summary}
                    </p>
                  ) : null}

                  {note ? (
                    <blockquote className="mt-3 rounded-xl border-l-4 border-amber-300 bg-white px-3 py-2 text-xs italic leading-5 text-stone-600">
                      “{note}”
                    </blockquote>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}