import Link from "next/link";
import { CalendarDays, PlayCircle, Radio, ArrowRight } from "lucide-react";
import { getUpcomingLiveItem } from "@/lib/upcoming-live";
import LiveCountdownCard from "@/components/home/live-countdown-card";

export default async function LiveUpcomingCard() {
  const upcoming = await getUpcomingLiveItem();

  if (!upcoming) {
    return (
      <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)]">
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 p-5 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
            <Radio size={12} />
            En vivo
          </div>

          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            No hay transmisión activa
          </h3>

          <p className="mt-2 text-sm leading-6 text-stone-300">
            Cuando haya una transmisión disponible o un próximo evento en línea,
            aparecerá aquí.
          </p>
        </div>

        <div className="p-5">
          <Link
            href="/eventos"
            className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
          >
            Ver eventos
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (upcoming.isActiveNow || upcoming.isJoinableNow) {
    return (
      <div className="overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)]">
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 p-5 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200">
            <Radio size={12} />
            {upcoming.isActiveNow ? "En vivo ahora" : "Disponible para entrar"}
          </div>

          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            {upcoming.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-stone-300">
            {upcoming.description}
          </p>

          <p className="mt-3 text-sm font-medium text-stone-200">
            {upcoming.dateLabel} · {upcoming.modeLabel}
          </p>
        </div>

        <div className="p-5">
          <Link
            href={upcoming.href}
            className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
          >
            <PlayCircle size={17} />
            Ir a En vivo
          </Link>
        </div>
      </div>
    );
  }

  return <LiveCountdownCard item={upcoming} />;
}