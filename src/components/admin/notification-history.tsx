"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Send,
} from "lucide-react";

export type NotificationHistoryRow = {
  id: string;
  type: string;
  service_plan_id: string | null;
  assignment_id: string | null;
  recipient: string;
  title: string;
  body: string;
  sent: boolean;
  sent_at: string | null;
  created_at: string;
};

type NotificationHistoryProps = {
  notifications: NotificationHistoryRow[];
};

type NotificationFilter =
  | "all"
  | "confirmed"
  | "changes"
  | "sent"
  | "pending";

function isChangeRequest(type: string) {
  return (
    type === "service_change_requested" ||
    type === "change_requested"
  );
}

function isConfirmation(type: string) {
  return (
    type === "service_confirmed" ||
    type === "confirmed_service"
  );
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  });
}

function formatRelativeTime(date: string) {
  const createdAt = new Date(date).getTime();
  const difference = Math.max(0, Date.now() - createdAt);

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 45) {
    return "Ahora mismo";
  }

  if (minutes < 60) {
    return `Hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  }

  if (hours < 24) {
    return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  }

  if (days < 7) {
    return `Hace ${days} ${days === 1 ? "día" : "días"}`;
  }

  return formatDateTime(date);
}

export default function NotificationHistory({
  notifications,
}: NotificationHistoryProps) {
  const [filter, setFilter] =
    useState<NotificationFilter>("all");

  const sentCount = notifications.filter(
    (notification) => notification.sent
  ).length;

  const pendingCount = notifications.filter(
    (notification) => !notification.sent
  ).length;

  const confirmedCount = notifications.filter(
    (notification) => isConfirmation(notification.type)
  ).length;

  const changesCount = notifications.filter(
    (notification) => isChangeRequest(notification.type)
  ).length;

  const filteredNotifications = useMemo(() => {
    if (filter === "confirmed") {
      return notifications.filter((notification) =>
        isConfirmation(notification.type)
      );
    }

    if (filter === "changes") {
      return notifications.filter((notification) =>
        isChangeRequest(notification.type)
      );
    }

    if (filter === "sent") {
      return notifications.filter(
        (notification) => notification.sent
      );
    }

    if (filter === "pending") {
      return notifications.filter(
        (notification) => !notification.sent
      );
    }

    return notifications;
  }, [filter, notifications]);

  return (
    <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Notificaciones
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            Historial de avisos
          </h2>

          <p className="mt-1 text-sm leading-6 text-stone-500">
            Confirmaciones y solicitudes enviadas a coordinación.
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
          <Bell size={20} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Confirmaciones"
          value={confirmedCount}
          className="border-emerald-100 bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          label="Cambios"
          value={changesCount}
          className="border-amber-100 bg-amber-50 text-amber-700"
        />

        <SummaryCard
          label="Enviadas"
          value={sentCount}
          className="border-sky-100 bg-sky-50 text-sky-700"
        />

        <SummaryCard
          label="Sin enviar"
          value={pendingCount}
          className="border-red-100 bg-red-50 text-red-700"
        />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`Todas (${notifications.length})`}
        />

        <FilterButton
          active={filter === "confirmed"}
          onClick={() => setFilter("confirmed")}
          label={`Confirmaciones (${confirmedCount})`}
        />

        <FilterButton
          active={filter === "changes"}
          onClick={() => setFilter("changes")}
          label={`Cambios (${changesCount})`}
        />

        <FilterButton
          active={filter === "sent"}
          onClick={() => setFilter("sent")}
          label={`Enviadas (${sentCount})`}
        />

        <FilterButton
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
          label={`Pendientes (${pendingCount})`}
        />
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="mt-5 rounded-[26px] border border-dashed border-stone-300 bg-stone-50 p-5">
          <div className="flex items-start gap-3">
            <Bell
              size={20}
              className="mt-0.5 shrink-0 text-stone-400"
            />

            <div>
              <p className="text-sm font-semibold text-stone-700">
                No hay avisos en este filtro
              </p>

              <p className="mt-1 text-sm leading-6 text-stone-500">
                Selecciona otra categoría para consultar el historial.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {filteredNotifications.map((notification) => {
            const warning = isChangeRequest(notification.type);

            const content = (
              <article
                className={`rounded-[26px] border p-4 transition ${
                  warning
                    ? "border-amber-100 bg-amber-50 hover:border-amber-200"
                    : "border-emerald-100 bg-emerald-50 hover:border-emerald-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      warning
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {warning ? (
                      <AlertTriangle size={19} />
                    ) : (
                      <CheckCircle2 size={19} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-950">
                          {notification.title}
                        </p>

                        <p className="mt-1 text-sm leading-5 text-stone-600">
                          {notification.body}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${
                          notification.sent
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {notification.sent
                          ? "Enviada"
                          : "Sin enviar"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
                      <span>
                        {formatRelativeTime(
                          notification.created_at
                        )}
                      </span>

                      {notification.sent_at ? (
                        <span>
                          Push:{" "}
                          {formatDateTime(
                            notification.sent_at
                          )}
                        </span>
                      ) : (
                        <span className="font-semibold text-red-600">
                          El Push no fue entregado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );

            if (!notification.assignment_id) {
              return (
                <div key={notification.id}>
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={notification.id}
                href={`/admin/assignment/${
                  notification.assignment_id
                }`}
                className="block"
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div
      className={`rounded-[22px] border p-3 text-center ${className}`}
    >
      <p className="text-2xl font-bold">{value}</p>

      <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em]">
        {label}
      </p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
        active
          ? "bg-stone-950 text-white"
          : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
  );
}