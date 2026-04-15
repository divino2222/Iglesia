"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import type { UpcomingLiveItem } from "@/lib/upcoming-live";

type Props = {
  item: UpcomingLiveItem;
};

function getCountdownState(startIso: string, endIso: string) {
  const now = new Date().getTime();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  if (now >= start && now < end) {
    return {
      mode: "active" as const,
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  if (now >= end) {
    return {
      mode: "ended" as const,
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  const diff = start - now;

  return {
    mode: "countdown" as const,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
  };
}

export default function LiveCountdownCard({ item }: Props) {
  const router = useRouter();
  const [state, setState] = useState(() =>
    getCountdownState(item.startsAtIso, item.endsAtIso)
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextState = getCountdownState(item.startsAtIso, item.endsAtIso);
      setState(nextState);

      if (nextState.mode === "ended") {
        router.refresh();
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [item.startsAtIso, item.endsAtIso, router]);

  const modeText = useMemo(() => item.modeLabel, [item.modeLabel]);

  if (state.mode === "active") {
    return (
      <div className="overflow-hidden rounded-[30px] border border-red-100 bg-zinc-950 text-white shadow-[0_18px_36px_rgba(0,0,0,0.18)]">
        <div className="p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200">
            <Radio size={12} />
            En vivo ahora
          </div>

          <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight">
            {item.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-stone-300">
            {item.dateLabel} · {modeText}
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm text-stone-300">
            <Clock3 size={15} />
            <span>Disponible en este momento</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-zinc-950 text-white shadow-[0_18px_36px_rgba(0,0,0,0.18)]">
      <div className="p-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
          <CalendarDays size={12} />
          Próxima transmisión
        </div>

        <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight">
          {item.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-stone-300">
          {item.dateLabel} · {modeText}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[22px] bg-white/8 px-4 py-4 text-center ring-1 ring-white/10">
            <p className="text-3xl font-semibold tracking-tight">
              {String(state.days).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Días
            </p>
          </div>

          <div className="rounded-[22px] bg-white/8 px-4 py-4 text-center ring-1 ring-white/10">
            <p className="text-3xl font-semibold tracking-tight">
              {String(state.hours).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Horas
            </p>
          </div>

          <div className="rounded-[22px] bg-white/8 px-4 py-4 text-center ring-1 ring-white/10">
            <p className="text-3xl font-semibold tracking-tight">
              {String(state.minutes).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Min
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-stone-300">
          <Clock3 size={15} />
          <span>Hora local de Ciudad de México</span>
        </div>
      </div>
    </div>
  );
}