"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import type { UpcomingLiveItem } from "@/lib/upcoming-live";

type Props = {
  item: UpcomingLiveItem;
};

function getTimeLeft(targetIso: string) {
  const now = new Date().getTime();
  const target = new Date(targetIso).getTime();
  const diff = Math.max(target - now, 0);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return { days, hours, minutes, done: diff <= 0 };
}

export default function LiveCountdownCard({ item }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(item.startsAtIso));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft(item.startsAtIso));
    }, 1000 * 30);

    return () => window.clearInterval(interval);
  }, [item.startsAtIso]);

  const modeText = useMemo(() => {
    return item.modeLabel;
  }, [item.modeLabel]);

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
              {String(timeLeft.days).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Días
            </p>
          </div>

          <div className="rounded-[22px] bg-white/8 px-4 py-4 text-center ring-1 ring-white/10">
            <p className="text-3xl font-semibold tracking-tight">
              {String(timeLeft.hours).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Horas
            </p>
          </div>

          <div className="rounded-[22px] bg-white/8 px-4 py-4 text-center ring-1 ring-white/10">
            <p className="text-3xl font-semibold tracking-tight">
              {String(timeLeft.minutes).padStart(2, "0")}
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