import { prayerSchedule } from "@/data/prayer-schedule";

import {
  formatAppDate,
  getAppCurrentMinutes,
  getAppTodayString,
  getDaysUntil,
} from "@/lib/date-time";

/* =========================================================
   HORARIO DE ORACIÓN
========================================================= */

const PRAYER_START_MINUTES = 20 * 60; // 8:00 PM
const PRAYER_END_MINUTES = 21 * 60; // 9:00 PM

/* =========================================================
   FORMATEAR FECHA
========================================================= */

export function formatPrayerDate(dateStr: string) {
  return formatAppDate(dateStr, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/* =========================================================
   ¿LA ORACIÓN TODAVÍA DEBE APARECER?
========================================================= */

function isPrayerStillUpcoming(dateStr: string) {
  const daysAway = getDaysUntil(dateStr);

  /*
   * Fecha futura.
   */
  if (daysAway > 0) {
    return true;
  }

  /*
   * Fecha pasada.
   */
  if (daysAway < 0) {
    return false;
  }

  /*
   * Es hoy:
   * seguimos mostrándola hasta las 9:00 PM.
   */
  return getAppCurrentMinutes() < PRAYER_END_MINUTES;
}

/* =========================================================
   ORACIONES PRÓXIMAS
========================================================= */

export function getUpcomingPrayerSchedule() {
  return prayerSchedule
    .filter((item) =>
      isPrayerStillUpcoming(item.date)
    )
    .sort((a, b) =>
      a.date.localeCompare(b.date)
    );
}

/* =========================================================
   PRÓXIMA ORACIÓN
========================================================= */

export function getNextPrayerScheduleItem() {
  return getUpcomingPrayerSchedule()[0];
}

/* =========================================================
   ¿GOOGLE MEET ESTÁ ABIERTO?
========================================================= */

export function isPrayerMeetOpen(dateStr: string) {
  const today = getAppTodayString();

  if (dateStr !== today) {
    return false;
  }

  const currentMinutes =
    getAppCurrentMinutes();

  return (
    currentMinutes >=
      PRAYER_START_MINUTES &&
    currentMinutes <
      PRAYER_END_MINUTES
  );
}

/* =========================================================
   AGRUPAR POR MES
========================================================= */

export function getGroupedPrayerSchedule() {
  return getUpcomingPrayerSchedule().reduce<
    Record<
      string,
      typeof prayerSchedule
    >
  >((groups, item) => {
    const month = formatAppDate(
      item.date,
      {
        month: "long",
      }
    );

    const key =
      month.charAt(0).toUpperCase() +
      month.slice(1);

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(item);

    return groups;
  }, {});
}

/* =========================================================
   ESTADOS
========================================================= */

export function getPrayerStatusLabel(
  status: string
) {
  if (status === "confirmed") {
    return "Confirmado";
  }

  if (status === "unavailable") {
    return "No podrá asistir";
  }

  return "Por confirmar";
}

export function getPrayerStatusClasses(
  status: string
) {
  if (status === "confirmed") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (status === "unavailable") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-amber-100 text-amber-700 border-amber-200";
}