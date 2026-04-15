"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Share2,
  PlusSquare,
  Smartphone,
  X,
  ExternalLink,
} from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "comunidad-vid-floating-install-dismissed";

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error safari standalone
    window.navigator.standalone === true
  );
}

export default function FloatingInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [visible, setVisible] = useState(false);
  const [compact, setCompact] = useState(false);

  const ios = useMemo(() => isIos(), []);
  const installed = useMemo(() => isStandalone(), []);

  useEffect(() => {
    if (installed) return;

    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (dismissed === "true") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onScroll = () => {
      setCompact(window.scrollY > 180);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("scroll", onScroll, { passive: true });

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 1200);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [installed]);

  const handleInstall = async () => {
    if (installed) return;

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;

      if (result.outcome === "accepted") {
        setVisible(false);
      }

      return;
    }

    setShowHelp(true);
  };

  const dismissFloating = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (installed || !visible) return null;

  return (
    <>
      <div className="fixed bottom-24 right-4 z-[125] sm:right-6">
        <div
          className={`flex items-center gap-2 border border-white/60 bg-[#f8f6f2]/95 shadow-[0_16px_38px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 ${
            compact
              ? "rounded-full px-2 py-2"
              : "rounded-full px-3 py-2"
          }`}
        >
          <button
            type="button"
            onClick={handleInstall}
            className={`inline-flex items-center gap-2 rounded-full bg-stone-900 text-white transition hover:bg-stone-800 active:scale-95 ${
              compact ? "px-3 py-2 text-xs" : "px-4 py-2 text-sm font-medium"
            }`}
            aria-label="Instalar app"
          >
            <Download size={15} />
            {compact ? "Instalar" : "Instalar app"}
          </button>

          <button
            type="button"
            onClick={dismissFloating}
            className="rounded-full p-2 text-stone-500 transition hover:bg-white active:scale-95"
            aria-label="Ocultar"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {showHelp ? (
        <>
          <div
            className="fixed inset-0 z-[150] bg-black/35 backdrop-blur-[2px]"
            onClick={() => setShowHelp(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-[160] mx-auto w-full max-w-md px-3 pb-4">
            <div className="overflow-hidden rounded-[32px] border border-white/60 bg-[#f8f6f2]/95 shadow-[0_28px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 px-5 py-5 text-white">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-200 backdrop-blur">
                  <Smartphone size={12} />
                  Instalación
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Instala Comunidad VID
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-300">
                  Agrega la app a tu pantalla principal para abrirla más rápido.
                </p>
              </div>

              <div className="space-y-4 px-5 py-5">
                {ios ? (
                  <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                    <div className="space-y-2 text-sm leading-6 text-stone-700">
                      <p>1. Toca el botón de compartir en Safari.</p>
                      <p>2. Elige <strong>Agregar a pantalla de inicio</strong>.</p>
                      <p>3. Confirma para instalar Comunidad VID.</p>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-stone-900">
                      <Share2 size={16} />
                      Compartir
                      <span className="text-stone-400">→</span>
                      <PlusSquare size={16} />
                      Agregar a inicio
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                    <p className="text-sm leading-6 text-stone-700">
                      Si no aparece la instalación automática, abre el menú del navegador
                      y busca <strong>Instalar aplicación</strong> o{" "}
                      <strong>Agregar a pantalla principal</strong>.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
                  >
                    Entendido
                  </button>

                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-900 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-50"
                  >
                    <ExternalLink size={16} />
                    Volver a intentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}