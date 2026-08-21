"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  LoaderCircle,
  UserRound,
} from "lucide-react";

type ManagerStatus =
  | "loading"
  | "unsupported"
  | "denied"
  | "inactive"
  | "active"
  | "error";

export default function PushNotificationManager() {
  const [status, setStatus] = useState<ManagerStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkCurrentState() {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setStatus("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      try {
        const registration =
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

        await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        setStatus(subscription ? "active" : "inactive");
      } catch (error) {
        console.error("Error comprobando Push:", error);

        setMessage(
          error instanceof Error
            ? error.message
            : "No se pudo comprobar el estado de Push."
        );

        setStatus("error");
      }
    }

    void checkCurrentState();
  }, []);

  if (status === "loading") {
    return (
      <section className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
            <LoaderCircle size={20} className="animate-spin" />
          </div>

          <div>
            <p className="text-sm font-semibold text-stone-950">
              Comprobando notificaciones
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Revisando este dispositivo.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (status === "unsupported") {
    return (
      <StatusCard
        icon={<AlertTriangle size={20} />}
        iconClass="bg-amber-100 text-amber-700"
        title="Push no disponible"
        description="Este navegador o dispositivo no es compatible con notificaciones Push."
      />
    );
  }

  if (status === "denied") {
    return (
      <StatusCard
        icon={<BellOff size={20} />}
        iconClass="bg-red-100 text-red-700"
        title="Permiso bloqueado"
        description="Las notificaciones están bloqueadas en este dispositivo. Habilítalas desde los permisos del navegador."
      />
    );
  }

  return (
    <section
      className={`rounded-[28px] border p-4 shadow-sm ${
        status === "active"
          ? "border-emerald-100 bg-emerald-50"
          : status === "error"
            ? "border-red-100 bg-red-50"
            : "border-stone-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            status === "active"
              ? "bg-emerald-100 text-emerald-700"
              : status === "error"
                ? "bg-red-100 text-red-700"
                : "bg-stone-100 text-stone-700"
          }`}
        >
          {status === "active" ? (
            <CheckCircle2 size={20} />
          ) : (
            <Bell size={20} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-950">
            {status === "active"
              ? "Notificaciones Push activadas"
              : status === "error"
                ? "No pudimos comprobar las notificaciones"
                : "Notificaciones pendientes"}
          </p>

          <p className="mt-1 text-xs leading-5 text-stone-600">
            {status === "active"
              ? "Este dispositivo ya tiene una suscripción Push activa vinculada a la sesión."
              : "La activación y administración del dispositivo se realiza desde Mi cuenta."}
          </p>

          {message ? (
            <p className="mt-2 text-xs leading-5 text-red-700">
              {message}
            </p>
          ) : null}
        </div>
      </div>

      {status !== "active" ? (
        <Link
          href="/mi-cuenta"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
        >
          <UserRound size={17} />
          Administrar desde Mi cuenta
        </Link>
      ) : null}
    </section>
  );
}

function StatusCard({
  icon,
  iconClass,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-semibold text-stone-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
