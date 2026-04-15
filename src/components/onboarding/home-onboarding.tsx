"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  MapPinned,
  Radio,
  HeartHandshake,
  Church,
  ArrowRight,
} from "lucide-react";

const STORAGE_KEY = "comunidad-vid-onboarding-seen";

export default function HomeOnboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-[2px]"
        onClick={close}
      />

      <div className="fixed inset-x-0 bottom-0 z-[100] mx-auto w-full max-w-md px-3 pb-4">
        <div className="overflow-hidden rounded-[32px] border border-white/60 bg-[#f8f6f2]/95 shadow-[0_28px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 px-5 py-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-300">
                  Bienvenido
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Tu iglesia en una app
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  Aquí puedes ver transmisiones, eventos, pedir oración y conocer más de Comunidad VID.
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                className="rounded-2xl p-2 text-stone-300 transition hover:bg-white/10 hover:text-white active:scale-95"
                aria-label="Cerrar onboarding"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-3 px-5 py-5">
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  <Radio size={12} />
                  En vivo
                </div>
                <p className="text-sm leading-6 text-stone-700">
                  Revisa la transmisión o el próximo evento en línea.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <HeartHandshake size={12} />
                  Oración
                </div>
                <p className="text-sm leading-6 text-stone-700">
                  Comparte tus peticiones y recibe acompañamiento.
                </p>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                  <MapPinned size={12} />
                  Visita
                </div>
                <p className="text-sm leading-6 text-stone-700">
                  Encuentra la ubicación, horarios y cómo llegar.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/visita"
                onClick={close}
                className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 active:scale-95"
              >
                <Church size={16} />
                Planifica tu visita
              </Link>

              <button
                type="button"
                onClick={close}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-900 shadow-sm ring-1 ring-stone-200 transition hover:bg-stone-50 active:scale-95"
              >
                Continuar
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}