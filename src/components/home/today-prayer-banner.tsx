import Link from "next/link";
import {
  Clock3,
  Headphones,
  Video,
} from "lucide-react";

import {
  getAppCurrentMinutes,
  getAppTodayString,
  getAppWeekday,
} from "@/lib/date-time";

import {
  PRAYER_MEET_URL,
  prayerSchedule,
} from "@/data/prayer-schedule";

const PRAYER_START_MINUTES = 20 * 60; // 8:00 PM
const PRAYER_END_MINUTES = 21 * 60; // 9:00 PM

/*
 * Mostramos el recordatorio desde las 5:00 PM.
 */
const PRAYER_REMINDER_MINUTES = 17 * 60;

function getTodayPrayerItem() {
  const today = getAppTodayString();

  return (
    prayerSchedule.find(
      (item) => item.date === today
    ) ?? null
  );
}

export default function TodayPrayerBanner() {
  const today = getAppTodayString();

  const weekday =
    getAppWeekday(today);

  /*
   * 2 = martes
   * 4 = jueves
   */
  if (
    weekday !== 2 &&
    weekday !== 4
  ) {
    return null;
  }

  const currentMinutes =
    getAppCurrentMinutes();

  /*
   * Antes de las 5:00 PM no mostramos
   * ningún banner especial.
   */
  if (
    currentMinutes <
    PRAYER_REMINDER_MINUTES
  ) {
    return null;
  }

  /*
   * Después de las 9:00 PM tampoco.
   */
  if (
    currentMinutes >=
    PRAYER_END_MINUTES
  ) {
    return null;
  }

  const prayerItem =
    getTodayPrayerItem();

  const isLive =
    currentMinutes >=
      PRAYER_START_MINUTES &&
    currentMinutes <
      PRAYER_END_MINUTES;

  const leader =
    prayerItem?.leader ?? null;

  return (
    <section
      className={`overflow-hidden rounded-[34px] border bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)] ${
        isLive
          ? "border-emerald-200"
          : "border-violet-100"
      }`}
    >
      <div
        className={`px-5 py-6 text-white ${
          isLive
            ? "bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-500"
            : "bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-500"
        }`}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
          <Headphones size={13} />

          Oración en línea
        </div>

        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          {isLive
            ? "La oración ya está en curso 🙏"
            : "Hoy tenemos oración"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/80">
          {isLive
            ? "Únete ahora y acompáñanos en este tiempo de oración."
            : "Nos reunimos hoy de 8:00 PM a 9:00 PM por Google Meet."}
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[22px] border border-stone-100 bg-stone-50 p-4">
            <Clock3
              size={18}
              className="text-stone-500"
            />

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              Horario
            </p>

            <p className="mt-1 text-sm font-semibold text-stone-950">
              8:00 PM – 9:00 PM
            </p>
          </div>

          <div className="rounded-[22px] border border-stone-100 bg-stone-50 p-4">
            <Headphones
              size={18}
              className="text-stone-500"
            />

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              Responsable
            </p>

            <p className="mt-1 text-sm font-semibold text-stone-950">
              {leader ||
                "Por confirmar"}
            </p>
          </div>
        </div>

        {isLive ? (
          <Link
            href={PRAYER_MEET_URL}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
          >
            <Video size={18} />

            Entrar a Google Meet
          </Link>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-stone-100 px-5 py-4 text-sm font-semibold text-stone-500">
            <Clock3 size={18} />

            Meet disponible a las 8:00 PM
          </div>
        )}
      </div>
    </section>
  );
}