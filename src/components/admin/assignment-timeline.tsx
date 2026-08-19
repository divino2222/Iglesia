import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock3,
  RotateCcw,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

export type AssignmentTimelineItem = {
  id: string;
  source: "activity" | "notification";
  action: string;
  description: string;
  actorName: string | null;
  createdAt: string;
  sent?: boolean | null;
  sentAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

type GroupedTimelineItem = AssignmentTimelineItem & {
  occurrences: number;
};

type AssignmentTimelineProps = {
  items: AssignmentTimelineItem[];
};

function normalizeDescription(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-MX")
    .replace(/\s+/g, " ");
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  });
}

function groupRepeatedItems(
  items: AssignmentTimelineItem[]
): GroupedTimelineItem[] {
  const grouped: GroupedTimelineItem[] = [];

  for (const item of items) {
    const previous = grouped[grouped.length - 1];

    const sameEvent =
      previous &&
      previous.source === item.source &&
      previous.action === item.action &&
      normalizeDescription(previous.description) ===
        normalizeDescription(item.description) &&
      previous.actorName === item.actorName;

    if (sameEvent) {
      previous.occurrences += 1;

      /*
       * Conservamos la fecha más reciente del grupo.
       */
      if (
        new Date(item.createdAt).getTime() >
        new Date(previous.createdAt).getTime()
      ) {
        previous.createdAt = item.createdAt;
        previous.sent = item.sent;
        previous.sentAt = item.sentAt;
      }

      continue;
    }

    grouped.push({
      ...item,
      occurrences: 1,
    });
  }

  return grouped;
}

function getTimelineStyle(item: AssignmentTimelineItem) {
  if (item.source === "notification") {
    if (item.sent) {
      return {
        icon: <Bell size={18} />,
        iconClass: "bg-violet-100 text-violet-700",
        lineClass: "bg-violet-200",
        cardClass: "border-violet-100 bg-violet-50",
        badgeClass: "bg-violet-100 text-violet-700",
        badge: "Push enviado",
      };
    }

    return {
      icon: <BellOff size={18} />,
      iconClass: "bg-red-100 text-red-700",
      lineClass: "bg-red-200",
      cardClass: "border-red-100 bg-red-50",
      badgeClass: "bg-red-100 text-red-700",
      badge: "Push pendiente",
    };
  }

  if (
    item.action === "confirmed_service" ||
    item.action === "admin_confirmed_assignment"
  ) {
    return {
      icon: <CheckCircle2 size={18} />,
      iconClass: "bg-emerald-100 text-emerald-700",
      lineClass: "bg-emerald-200",
      cardClass: "border-emerald-100 bg-emerald-50",
      badgeClass: "bg-emerald-100 text-emerald-700",
      badge: "Confirmación",
    };
  }

  if (
    item.action === "requested_change" ||
    item.action === "reopened_change_request"
  ) {
    return {
      icon: <RotateCcw size={18} />,
      iconClass: "bg-amber-100 text-amber-700",
      lineClass: "bg-amber-200",
      cardClass: "border-amber-100 bg-amber-50",
      badgeClass: "bg-amber-100 text-amber-700",
      badge:
        item.action === "reopened_change_request"
          ? "Solicitud reabierta"
          : "Cambio solicitado",
    };
  }

  if (item.action === "resolved_change_request") {
    return {
      icon: <CheckCircle2 size={18} />,
      iconClass: "bg-emerald-100 text-emerald-700",
      lineClass: "bg-emerald-200",
      cardClass: "border-emerald-100 bg-emerald-50",
      badgeClass: "bg-emerald-100 text-emerald-700",
      badge: "Solicitud resuelta",
    };
  }

  if (
    item.action === "updated_members" ||
    item.action === "replacement_assigned"
  ) {
    return {
      icon: <UserRoundCheck size={18} />,
      iconClass: "bg-sky-100 text-sky-700",
      lineClass: "bg-sky-200",
      cardClass: "border-sky-100 bg-sky-50",
      badgeClass: "bg-sky-100 text-sky-700",
      badge: "Reemplazo",
    };
  }

  if (item.action === "admin_marked_pending") {
    return {
      icon: <Clock3 size={18} />,
      iconClass: "bg-amber-100 text-amber-700",
      lineClass: "bg-amber-200",
      cardClass: "border-amber-100 bg-amber-50",
      badgeClass: "bg-amber-100 text-amber-700",
      badge: "Pendiente",
    };
  }

  if (item.action.includes("change")) {
    return {
      icon: <AlertTriangle size={18} />,
      iconClass: "bg-red-100 text-red-700",
      lineClass: "bg-red-200",
      cardClass: "border-red-100 bg-red-50",
      badgeClass: "bg-red-100 text-red-700",
      badge: "Incidencia",
    };
  }

  return {
    icon: <UsersRound size={18} />,
    iconClass: "bg-stone-100 text-stone-700",
    lineClass: "bg-stone-200",
    cardClass: "border-stone-100 bg-stone-50",
    badgeClass: "bg-stone-200 text-stone-600",
    badge: "Actividad",
  };
}

export default function AssignmentTimeline({
  items,
}: AssignmentTimelineProps) {
  const sortedItems = [...items].sort(
    (first, second) =>
      new Date(first.createdAt).getTime() -
      new Date(second.createdAt).getTime()
  );

  const groupedItems = groupRepeatedItems(sortedItems);

  return (
    <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
        Historial
      </p>

      <h2 className="mt-1 text-2xl font-semibold text-stone-950">
        Línea del tiempo
      </h2>

      <p className="mt-1 text-sm leading-6 text-stone-500">
        Actividad, decisiones y notificaciones relacionadas con esta
        asignación.
      </p>

      {groupedItems.length === 0 ? (
        <div className="mt-5 rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-5">
          <p className="text-sm font-semibold text-stone-700">
            Todavía no hay movimientos registrados.
          </p>

          <p className="mt-1 text-xs leading-5 text-stone-500">
            Las respuestas, resoluciones y notificaciones aparecerán
            aquí.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          {groupedItems.map((item, index) => {
            const style = getTimelineStyle(item);
            const isLast = index === groupedItems.length - 1;

            return (
              <div
                key={`${item.source}-${item.id}`}
                className="relative flex gap-4"
              >
                <div className="relative flex w-11 shrink-0 justify-center">
                  <div
                    className={`z-10 flex h-11 w-11 items-center justify-center rounded-2xl ${style.iconClass}`}
                  >
                    {style.icon}
                  </div>

                  {!isLast ? (
                    <div
                      className={`absolute bottom-0 top-11 w-px ${style.lineClass}`}
                    />
                  ) : null}
                </div>

                <div className={isLast ? "flex-1" : "flex-1 pb-6"}>
                  <article
                    className={`rounded-[22px] border p-4 ${style.cardClass}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-semibold leading-5 text-stone-950">
                        {item.description}
                      </p>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${style.badgeClass}`}
                      >
                        {style.badge}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                      <span>{formatDateTime(item.createdAt)}</span>

                      {item.actorName ? (
                        <span>Por {item.actorName}</span>
                      ) : null}

                      {item.occurrences > 1 ? (
                        <span className="font-semibold text-stone-700">
                          Repetido {item.occurrences} veces
                        </span>
                      ) : null}
                    </div>

                    {item.source === "notification" ? (
                      <div className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-xs text-stone-600">
                        {item.sent ? (
                          <>
                            Entrega registrada
                            {item.sentAt
                              ? ` el ${formatDateTime(item.sentAt)}`
                              : "."}
                          </>
                        ) : (
                          "El aviso fue creado, pero no existe confirmación de envío Push."
                        )}
                      </div>
                    ) : null}
                  </article>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}