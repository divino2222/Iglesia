"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Radio,
  Timer,
  WifiOff,
  LogIn,
} from "lucide-react";

type Props = {
  startsAtIso: string;
  isJoinableNow?: boolean;
  isActiveNow?: boolean;
};

function formatTimeRemaining(diffMs: number) {
  const totalMinutes = Math.max(0, Math.floor(diffMs / 1000 / 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `Comienza en ${days}d ${hours}h`;
  if (hours > 0) return `Comienza en ${hours}h ${minutes}min`;
  return `Comienza en ${minutes}min`;
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

export default function LiveStatusChip({
  startsAtIso,
  isJoinableNow = false,
  isActiveNow = false,
}: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const startsAt = useMemo(() => new Date(startsAtIso), [startsAtIso]);
  const diff = startsAt.getTime() - now.getTime();

  const content = useMemo(() => {
    if (isJoinableNow) {
      return {
        label: "Acceso disponible",
        classes: "bg-emerald-100 text-emerald-700",
        icon: <LogIn size={12} />,
      };
    }

    if (isActiveNow) {
      return {
        label: "En vivo ahora",
        classes: "bg-red-100 text-red-700",
        icon: <Radio size={12} />,
      };
    }

    if (diff > 0 && diff <= 6 * 60 * 60 * 1000) {
      return {
        label: formatTimeRemaining(diff),
        classes: "bg-amber-100 text-amber-700",
        icon: <Timer size={12} />,
      };
    }

    if (sameLocalDay(now, startsAt) && diff > 0) {
      return {
        label: `Hoy a las ${formatHour(startsAt)}`,
        classes: "bg-blue-100 text-blue-700",
        icon: <CalendarDays size={12} />,
      };
    }

    if (diff > 0) {
      return {
        label: "Próxima transmisión",
        classes: "bg-stone-100 text-stone-700",
        icon: <CalendarDays size={12} />,
      };
    }

    return {
      label: "Offline",
      classes: "bg-zinc-100 text-zinc-600",
      icon: <WifiOff size={12} />,
    };
  }, [diff, isActiveNow, isJoinableNow, now, startsAt]);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${content.classes}`}
    >
      {content.icon}
      {content.label}
    </span>
  );
}