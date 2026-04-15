"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Radio, Timer } from "lucide-react";

type Props = {
  startsAtIso: string;
  title: string;
  dateLabel: string;
  modeLabel: string;
};

function formatParts(diffMs: number) {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

  return { days, hours, minutes };
}

function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHour(date: Date) {
  return date.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LiveCountdownCard({
  startsAtIso,
  title,
  dateLabel,
  modeLabel,
}: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const startsAt = useMemo(() => new Date(startsAtIso), [startsAtIso]);
  const diff = startsAt.getTime() - now.getTime();
  const parts = formatParts(diff);

  const status = useMemo(() => {
    if (diff <= 0 && Math.abs(diff) < 2 * 60 * 60 * 1000) {
      return {
        label: "En vivo ahora",
        classes: "bg-red-100 text-red-700",
        icon: <Radio size={14} />,
      };
    }

    if (sameLocalDay(now, startsAt)) {
      return {
        label: `Hoy a las ${formatHour(startsAt)}`,
        classes: "bg-blue-100 text-blue-700",
        icon: <CalendarDays size={14} />,
      };
    }

    return {
      label: "Próxima transmisión",
      classes: "bg-stone-100 text-stone-700",
      icon: <CalendarDays size={14} />,
    };
  }, [diff, now, startsAt]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 p-6 text-white">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}
        >
          {status.icon}
          {status.label}
        </div>

        <h2 className="mt-4 text-2xl font-semibold leading-tight">{title}</h2>

        <p className="mt-2 text-sm text-stone-300">
          {dateLabel} · {modeLabel}
        </p>

        {diff > 0 ? (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
              <p className="text-3xl font-semibold">
                {String(parts.days).padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-300">
                Días
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
              <p className="text-3xl font-semibold">
                {String(parts.hours).padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-300">
                Horas
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
              <p className="text-3xl font-semibold">
                {String(parts.minutes).padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-300">
                Min
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 backdrop-blur">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <Timer size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">La transmisión ya comenzó</p>
              <p className="text-sm text-stone-300">
                Entra ahora y acompáñanos en vivo.
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 text-sm text-stone-300">
          <Clock3 size={16} />
          <span>Hora local de Ciudad de México</span>
        </div>
      </div>
    </div>
  );
}