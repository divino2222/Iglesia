"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import {
  disableServerPushSubscription,
  saveServerPushSubscription,
} from "@/app/(site)/mi-servicio/push-actions";

type Status =
  | "loading"
  | "unsupported"
  | "denied"
  | "inactive"
  | "active"
  | "error";

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = `${base64String}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(
    rawData.length
  );

  for (
    let index = 0;
    index < rawData.length;
    index += 1
  ) {
    outputArray[index] =
      rawData.charCodeAt(index);
  }

  return outputArray;
}

function serializeSubscription(
  subscription: PushSubscription
) {
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
    expirationTime:
      json.expirationTime ?? null,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  };
}

export default function ServerPushManager() {
  const [status, setStatus] =
    useState<Status>("loading");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkStatus() {
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
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );

        await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        setStatus(
          subscription ? "active" : "inactive"
        );
      } catch (error) {
        console.error(error);

        setMessage(
          error instanceof Error
            ? error.message
            : "No se pudo comprobar el estado."
        );

        setStatus("error");
      }
    }

    void checkStatus();
  }, []);

  async function activate() {
    setBusy(true);
    setMessage("");

    try {
      const publicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error(
          "Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY."
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

        return;
      }

      const registration =
        await navigator.serviceWorker.register(
          "/sw.js",
          {
            scope: "/",
          }
        );

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

      await saveServerPushSubscription(
        serializeSubscription(subscription),
        navigator.userAgent
      );

      setStatus("active");
      setMessage(
        "Recibirás avisos sobre tus asignaciones."
      );
    } catch (error) {
      console.error(error);

      setStatus("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron activar las notificaciones."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    setBusy(true);
    setMessage("");

    try {
      const registration =
        await navigator.serviceWorker.ready;

      const subscription =
        await registration.pushManager.getSubscription();

      if (subscription) {
        await disableServerPushSubscription(
          subscription.endpoint
        );

        await subscription.unsubscribe();
      }

      setStatus("inactive");
      setMessage(
        "Las notificaciones se desactivaron."
      );
    } catch (error) {
      console.error(error);

      setStatus("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron desactivar."
      );
    } finally {
      setBusy(false);
    }
  }

  if (
    status === "unsupported" ||
    status === "denied"
  ) {
    return null;
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
              : "bg-stone-100 text-stone-700"
          }`}
        >
          {status === "loading" || busy ? (
            <LoaderCircle
              size={19}
              className="animate-spin"
            />
          ) : status === "active" ? (
            <CheckCircle2 size={19} />
          ) : (
            <Bell size={19} />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-stone-950">
            {status === "active"
              ? "Avisos activados"
              : "Recibe avisos de tu servicio"}
          </p>

          <p className="mt-1 text-xs leading-5 text-stone-600">
            {status === "active"
              ? "Te avisaremos sobre cambios y nuevas asignaciones."
              : "Activa las notificaciones en este dispositivo."}
          </p>

          {message ? (
            <p className="mt-2 text-xs text-stone-500">
              {message}
            </p>
          ) : null}
        </div>
      </div>

      {status === "active" ? (
        <button
          type="button"
          disabled={busy}
          onClick={deactivate}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 disabled:opacity-50"
        >
          <BellOff size={17} />
          Desactivar avisos
        </button>
      ) : (
        <button
          type="button"
          disabled={
            busy || status === "loading"
          }
          onClick={activate}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Bell size={17} />
          Activar avisos
        </button>
      )}
    </section>
  );
}