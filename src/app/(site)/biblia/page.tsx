import { BookOpen, WifiOff, Search, Smartphone } from "lucide-react";
import BibleReader from "@/components/bible/bible-reader";

export default function BibliaPage() {
  return (
    <div className="space-y-6 px-4 py-6">
      <section className="overflow-hidden rounded-[34px] border border-white/60 bg-white/70 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-sm">
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 px-5 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
            <BookOpen size={12} />
            Biblia
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Biblia en la app
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-300">
            Acceso rápido a la Palabra con una experiencia clara, ágil y lista
            para seguir creciendo offline.
          </p>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-4 py-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700">
              <Search size={18} />
            </div>
            <p className="text-sm font-semibold text-stone-900">
              Búsqueda rápida
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Encuentra libros y capítulos con facilidad.
            </p>
          </div>

          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700">
              <WifiOff size={18} />
            </div>
            <p className="text-sm font-semibold text-stone-900">
              Base offline real
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Los libros abiertos quedan listos para leerse después sin conexión.
            </p>
          </div>

          <div className="rounded-[24px] border border-violet-100 bg-violet-50 px-4 py-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700">
              <Smartphone size={18} />
            </div>
            <p className="text-sm font-semibold text-stone-900">
              Experiencia de app
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Pensada para abrir rápido desde el celular y leer con claridad.
            </p>
          </div>
        </div>
      </section>

      <BibleReader />
    </div>
  );
}