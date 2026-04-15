"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, Download, X } from "lucide-react";

export default function AppUpdatePrompt() {
  const [show, setShow] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShow(true);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(registration.waiting || newWorker);
            setShow(true);
          }
        });
      });

      registration.update().catch(() => {});
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  const updateApp = () => {
    if (!waitingWorker) {
      window.location.reload();
      return;
    }

    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-3 z-[200] mx-auto w-full max-w-md px-3">
      <div className="overflow-hidden rounded-[26px] border border-white/60 bg-[#f8f6f2]/95 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="flex items-start gap-3 px-4 py-4">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white">
            <RefreshCcw size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-stone-950">
              Hay una nueva versión disponible
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Actualiza la app para ver los cambios más recientes.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={updateApp}
                className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                <Download size={15} />
                Actualizar ahora
              </button>

              <button
                type="button"
                onClick={() => setShow(false)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-stone-900 ring-1 ring-stone-200 transition hover:bg-stone-50"
              >
                Más tarde
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShow(false)}
            className="rounded-full p-2 text-stone-500 transition hover:bg-white"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}