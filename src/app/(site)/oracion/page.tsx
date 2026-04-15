import { HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import PrayerRequestForm from "@/components/forms/prayer-request-form";

export default function PrayerPage() {
  return (
    <div className="px-4 py-6">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          Peticiones de oración
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Comparte tu petición con nosotros. Queremos acompañarte en oración.
        </p>
      </div>

      <div className="mb-5 grid gap-3">
        <div className="flex items-start gap-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100">
            <HeartHandshake size={18} className="text-rose-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Oramos contigo</p>
            <p className="mt-1 text-sm text-stone-600">
              Tu petición será recibida con cuidado y respeto.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
            <ShieldCheck size={18} className="text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Privacidad</p>
            <p className="mt-1 text-sm text-stone-600">
              Puedes marcar tu petición como privada si así lo deseas.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
            <Sparkles size={18} className="text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Acompañamiento</p>
            <p className="mt-1 text-sm text-stone-600">
              Creemos en el poder de la oración y en caminar contigo.
            </p>
          </div>
        </div>
      </div>

      <PrayerRequestForm />
    </div>
  );
}