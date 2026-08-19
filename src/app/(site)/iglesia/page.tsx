import {
  Heart,
  Cross,
  Target,
  Sparkles,
  Users,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { churchIdentity } from "@/lib/church-identity";

export default function IglesiaPage() {
  return (
    <div className="space-y-6 px-4 py-6">
      <section className="overflow-hidden rounded-[34px] border border-white/60 bg-white/70 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-sm">
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 px-5 py-6 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-300">
            Comunidad VID
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Conócenos
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-300">
            Nuestra visión, misión y valores culturales reflejan la forma en que
            caminamos juntos como comunidad.
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <Target size={12} />
              Visión
            </div>

            <p className="text-xl font-semibold tracking-tight text-stone-950">
              {churchIdentity.vision}
            </p>
          </div>

          <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Cross size={12} />
              Misión
            </div>

            <div className="grid gap-3">
              {churchIdentity.mission.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white/80 px-4 py-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <ChevronRight size={16} />
                  </div>
                  <p className="text-sm font-medium leading-6 text-stone-800">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">
              <Sparkles size={12} />
              Valores culturales
            </div>

            <div className="space-y-3">
              {churchIdentity.culturalValues.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-white/80 px-4 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-700">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-stone-800">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              <BookOpen size={12} />
              Biblia
            </div>

            <p className="text-sm leading-6 text-stone-700">
              También puedes abrir la Biblia desde la app para leer de forma
              rápida y sencilla.
            </p>

            <div className="mt-4">
              <Link
                href="/biblia"
                className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
              >
                Abrir Biblia
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}