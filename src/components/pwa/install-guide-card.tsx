"use client";

import {
  Smartphone,
  Share2,
  PlusSquare,
  Download,
  Monitor,
} from "lucide-react";

type Props = {
  platform?: "ios" | "android" | "all";
};

export default function InstallGuideCard({ platform = "all" }: Props) {
  const showIos = platform === "ios" || platform === "all";
  const showAndroid = platform === "android" || platform === "all";

  return (
    <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-[0_14px_30px_rgba(0,0,0,0.06)]">
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
          <Smartphone size={12} />
          Instala la app
        </div>

        <h3 className="mt-3 text-xl font-semibold tracking-tight text-stone-950">
          Agrega Comunidad VID a tu pantalla principal
        </h3>

        <p className="mt-2 text-sm leading-6 text-stone-500">
          Instálala como app para abrir más rápido, con una experiencia más limpia y más parecida a una app nativa.
        </p>
      </div>

      <div className="grid gap-4">
        {showIos ? (
          <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              <Share2 size={12} />
              iPhone / iPad
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-amber-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    Abre la app en Safari
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    La instalación en iPhone funciona mejor desde Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-amber-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                  2
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-stone-900">
                    <Share2 size={15} className="text-stone-500" />
                    Toca Compartir
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Busca el botón de compartir en la parte inferior o superior del navegador.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-amber-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                  3
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-stone-900">
                    <PlusSquare size={15} className="text-stone-500" />
                    Elige Agregar a pantalla de inicio
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Confirma y Comunidad VID aparecerá como app en tu celular.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showAndroid ? (
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              <Monitor size={12} />
              Android / Chrome
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-blue-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    Abre la app en Chrome
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Ahí normalmente aparece la opción para instalar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-blue-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                  2
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-stone-900">
                    <Download size={15} className="text-stone-500" />
                    Toca Instalar app
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Puede aparecer automáticamente o dentro del menú del navegador.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-blue-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    Confirma la instalación
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    La app quedará en tu pantalla principal como acceso directo premium.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}