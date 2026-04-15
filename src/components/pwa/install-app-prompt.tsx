"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  X,
  Sparkles,
} from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "comunidad-vid-install-prompt-dismissed";

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error safari standalone
    window.navigator.standalone === true
  );
}

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  const installed = useMemo(() => isInStandaloneMode(), []);
  const ios = useMemo(() => isIos(), []);

  useEffect(() => {
    if (installed) return;

    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (dismissed === "true") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const timer = window.setTimeout(() => {
      if (ios) setOpen(true);
    }, 900);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.clearTimeout(timer);
    };
  }, [installed, ios]);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new CustomEvent("cv-install-prompt-closed"));
    setOpen(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setOpen(false);
      window.dispatchEvent(new CustomEvent("cv-install-prompt-closed"));
    } else {
      window.localStorage.setItem(STORAGE_KEY, "true");
      setOpen(false);
      window.dispatchEvent(new CustomEvent("cv-install-prompt-closed"));
    }
  };

  if (installed || !open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[110] bg-black/35 backdrop-blur-[2px]"
        onClick={close}
      />

      <div className="fixed inset-x-0 bottom-0 z-[120] mx-auto w-full max-w-md px-3 pb-4">
        <div className="overflow-hidden rounded-[34px] border border-white/60 bg-[#f8f6f2]/95 shadow-[0_28px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 px-5 py-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-200 backdrop-blur">
                  <Sparkles size={12} />
                  App premium
                </div>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Instala Comunidad VID
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-300">
                  Accede más rápido desde tu pantalla principal, como una app real.
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
                <Smartphone size={12} />
                Beneficios
              </div>

              <ul className="space-y-2 text-sm leading-6 text-stone-700">
                <li>• Apertura más rápida desde tu celular</li>
                <li>• Experiencia más parecida a una app nativa</li>
                <li>• Acceso fácil a transmisiones, eventos y oración</li>
              </ul>
            </div>

            {deferredPrompt ? (
              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <Download size={12} />
                  Instalación disponible
                </div>

                <p className="text-sm leading-6 text-stone-700">
                  Tu navegador permite instalar la app directamente ahora.
                </p>

                <button
                  type="button"
                  onClick={handleInstall}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 active:scale-95"
                >
                  <Download size={16} />
                  Instalar app
                </button>
              </div>
            ) : ios ? (
              <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  <Share2 size={12} />
                  iPhone / iPad
                </div>

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
              <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                  <Download size={12} />
                  Instálala desde el navegador
                </div>

                <p className="text-sm leading-6 text-stone-700">
                  Si no aparece la opción automática, abre el menú de Chrome y busca
                  <strong> Instalar aplicación</strong> o <strong>Agregar a pantalla principal</strong>.
                </p>
              </div>
            )}

            <div className="flex gap-3">
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