"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";

const STORAGE_KEY = "comunidad-vid-push-prompt-dismissed";

export default function PushNotificationsPrompt() {
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator;

    setSupported(isSupported);

    if (!isSupported) {
      setPermissionState("unsupported");
      return;
    }

    setPermissionState(Notification.permission);

    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (!dismissed && Notification.permission === "default") {
      const timer = window.setTimeout(() => setOpen(true), 2200);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const requestPermission = async () => {
    if (!supported) return;
    const permission = await Notification.requestPermission();
    setPermissionState(permission);
    setOpen(false);
  };

  if (!supported || !open || permissionState !== "default") return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[130] bg-black/30 backdrop-blur-[2px]"
        onClick={close}
      />

      <div className="fixed inset-x-0 bottom-0 z-[140] mx-auto w-full max-w-md px-3 pb-4">
        <div className="overflow-hidden rounded-[32px] border border-white/60 bg-[#f8f6f2]/95 shadow-[0_28px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 px-5 py-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-200 backdrop-blur">
                  <BellRing size={12} />
                  Notificaciones
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Mantente al día
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-300">
                  Recibe avisos cuando haya transmisión, eventos próximos o noticias importantes de Comunidad VID.
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                className="rounded-2xl p-2 text-stone-300 transition hover:bg-white/10 hover:text-white active:scale-95"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                <Bell size={12} />
                Qué recibirás
              </div>
              <ul className="space-y-2 text-sm leading-6 text-stone-700">
                <li>• Avisos antes de transmisiones en vivo</li>
                <li>• Recordatorios de oración y eventos</li>
                <li>• Novedades importantes de la iglesia</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={requestPermission}
                className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 active:scale-95"
              >
                <BellRing size={16} />
                Activar notificaciones
              </button>

              <button
                type="button"
                onClick={close}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-900 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-50 active:scale-95"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}