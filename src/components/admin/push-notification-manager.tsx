"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import {
  disableAdminPushSubscription,
  saveAdminPushSubscription,
} from "@/app/admin/push/actions";

type PushNotificationManagerProps = {
  pin: string;
};

type ManagerStatus =
  | "loading"
  | "unsupported"
  | "denied"
  | "inactive"
  | "active"
  | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = `${base64String}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function serializeSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();

  if (
    !json.endpoint ||
    !json.keys?.p256dh ||
    !json.keys?.auth
  ) {
    throw new Error(
      "El navegador devolvió una suscripción incompleta."
    );
  }

  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  };
}

export default function PushNotificationManager({
  pin,
}: PushNotificationManagerProps) {
  const [status, setStatus] =
    useState<ManagerStatus>("loading");

  const [busy, setBusy] = useState(false);
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

  async function enableNotifications() {
    setBusy(true);
    setMessage("");

    try {
      const publicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error(
          "Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en .env.local."
        );
      }

      const permission =
        await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus(
          permission === "denied"
            ? "denied"
            : "inactive"
        );

        setMessage(
          "No se concedió permiso para mostrar notificaciones."
        );

        return;
      }

      const registration =
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

      await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(publicKey),
          });
      }

      await saveAdminPushSubscription(
        pin,
        serializeSubscription(subscription),
        navigator.userAgent
      );

      setStatus("active");
      setMessage(
        "Este dispositivo recibirá confirmaciones y solicitudes de cambio."
      );
    } catch (error) {
      console.error("Error activando Push:", error);

      setStatus("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible activar las notificaciones."
      );
    } finally {
      setBusy(false);
    }
  }

  async function disableNotifications() {
    setBusy(true);
    setMessage("");

    try {
      const registration =
        await navigator.serviceWorker.ready;

      const subscription =
        await registration.pushManager.getSubscription();

      if (subscription) {
        await disableAdminPushSubscription(
          pin,
          subscription.endpoint
        );

        await subscription.unsubscribe();
      }

      setStatus("inactive");
      setMessage(
        "Las notificaciones se desactivaron en este dispositivo."
      );
    } catch (error) {
      console.error("Error desactivando Push:", error);

      setStatus("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible desactivar las notificaciones."
      );
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <section className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
            <LoaderCircle
              size={20}
              className="animate-spin"
            />
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
        description="Las notificaciones están bloqueadas. Debes habilitarlas desde los permisos del navegador."
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
                ? "No se pudieron activar"
                : "Recibir avisos en este dispositivo"}
          </p>

          <p className="mt-1 text-xs leading-5 text-stone-600">
            {status === "active"
              ? "Recibirás avisos aunque no estés viendo el Dashboard."
              : "Activa los avisos de confirmaciones y solicitudes de cambio."}
          </p>

          {message ? (
            <p
              className={`mt-2 text-xs leading-5 ${
                status === "error"
                  ? "text-red-700"
                  : "text-stone-500"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>
      </div>

      {status === "active" ? (
        <button
          type="button"
          disabled={busy}
          onClick={disableNotifications}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <BellOff size={17} />
          )}

          Desactivar en este dispositivo
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={enableNotifications}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <Bell size={17} />
          )}

          Activar notificaciones
        </button>
      )}
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
          <p className="text-sm font-semibold text-stone-950">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-stone-600">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}