"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AdminNotificationListenerProps = {
  servicePlanId: string;
};

type NotificationRow = {
  id: string;
  type: string;
  service_plan_id: string | null;
  assignment_id: string | null;
  recipient: string;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  sent: boolean;
  sent_at: string | null;
  created_at: string;
};

type ToastNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
};

function isWarningNotification(type: string) {
  return (
    type === "service_change_requested" ||
    type === "change_requested"
  );
}

export default function AdminNotificationListener({
  servicePlanId,
}: AdminNotificationListenerProps) {
  const router = useRouter();

  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const savedPreference = window.localStorage.getItem(
      "admin-notification-sound"
    );

    if (savedPreference === "off") {
      setSoundEnabled(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    function refreshDashboard() {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }

      refreshTimer.current = setTimeout(() => {
        router.refresh();
      }, 350);
    }

    function playNotificationSound() {
      if (!soundEnabled) return;

      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.55;

      audio.play().catch(() => {
        /*
         * Algunos navegadores bloquean el audio hasta que el usuario
         * haya interactuado con la página. No interrumpimos la app.
         */
      });
    }

    function showNotification(notification: NotificationRow) {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }

      setToast({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
      });

      playNotificationSound();
      refreshDashboard();

      dismissTimer.current = setTimeout(() => {
        setToast(null);
      }, 7000);
    }

    const channel = supabase
      .channel(`admin-notifications-${servicePlanId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_queue",
          filter: `service_plan_id=eq.${servicePlanId}`,
        },
        (payload) => {
          const notification = payload.new as NotificationRow;

          if (notification.recipient !== "admin") {
            return;
          }

          showNotification(notification);
        }
      )
      .subscribe((status, error) => {
        setConnected(status === "SUBSCRIBED");

        if (error) {
          console.error(
            "Error escuchando notification_queue:",
            error
          );
        }
      });

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }

      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [router, servicePlanId, soundEnabled]);

  function toggleSound() {
    const nextValue = !soundEnabled;

    setSoundEnabled(nextValue);

    window.localStorage.setItem(
      "admin-notification-sound",
      nextValue ? "on" : "off"
    );
  }

  const isWarning = toast
    ? isWarningNotification(toast.type)
    : false;

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              connected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            <Bell size={18} />

            <span
              className={`absolute right-1 top-1 h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />

            {connected ? (
              <span className="absolute right-1 top-1 h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-60" />
            ) : null}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-950">
              {connected
                ? "Notificaciones activas"
                : "Conectando notificaciones"}
            </p>

            <p className="mt-0.5 text-xs text-stone-500">
              Confirmaciones y solicitudes aparecerán aquí.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSound}
          aria-label={
            soundEnabled
              ? "Desactivar sonido"
              : "Activar sonido"
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-600 transition hover:bg-stone-200"
        >
          {soundEnabled ? (
            <Volume2 size={18} />
          ) : (
            <VolumeX size={18} />
          )}
        </button>
      </div>

      {toast ? (
        <div className="fixed inset-x-4 top-4 z-[120] mx-auto max-w-md animate-in slide-in-from-top-4 duration-300 sm:left-auto sm:right-6 sm:top-6 sm:mx-0 sm:w-[400px]">
          <div
            className={`relative overflow-hidden rounded-[28px] border bg-white p-4 shadow-[0_22px_70px_rgba(0,0,0,0.2)] ${
              isWarning
                ? "border-amber-200"
                : "border-emerald-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  isWarning
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isWarning ? (
                  <AlertTriangle size={21} />
                ) : (
                  <CheckCircle2 size={21} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-950">
                  {toast.title}
                </p>

                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {toast.body}
                </p>

                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Ahora mismo
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Cerrar notificación"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1 bg-stone-100">
              <div
                className={`h-full origin-left animate-[notification-progress_7s_linear_forwards] ${
                  isWarning
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}