import { prayerSchedule } from "@/data/prayer-schedule";

export function getMexicoCityNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

export function parsePrayerDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 20, 0, 0, 0);
}

export function formatPrayerDate(dateStr: string) {
  const date = parsePrayerDate(dateStr);

  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });
}

export function getUpcomingPrayerSchedule() {
  const now = getMexicoCityNow();

  return prayerSchedule
    .filter((item) => {
      const end = parsePrayerDate(item.date);
      end.setHours(21, 0, 0, 0);
      return end.getTime() > now.getTime();
    })
    .sort(
      (a, b) =>
        parsePrayerDate(a.date).getTime() - parsePrayerDate(b.date).getTime()
    );
}

export function getNextPrayerScheduleItem() {
  return getUpcomingPrayerSchedule()[0];
}

export function isPrayerMeetOpen(dateStr: string) {
  const now = getMexicoCityNow();
  const start = parsePrayerDate(dateStr);
  const end = new Date(start);
  end.setHours(21, 0, 0, 0);

  return now >= start && now < end;
}

export function getGroupedPrayerSchedule() {
  return getUpcomingPrayerSchedule().reduce<Record<string, typeof prayerSchedule>>(
    (groups, item) => {
      const date = parsePrayerDate(item.date);

      const month = date.toLocaleDateString("es-MX", {
        month: "long",
        timeZone: "America/Mexico_City",
      });

      const key = month.charAt(0).toUpperCase() + month.slice(1);

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);

      return groups;
    },
    {}
  );
}

export function getPrayerStatusLabel(status: string) {
  if (status === "confirmed") return "Confirmado";
  if (status === "unavailable") return "No podrá asistir";
  return "Por confirmar";
}

export function getPrayerStatusClasses(status: string) {
  if (status === "confirmed") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (status === "unavailable") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-amber-100 text-amber-700 border-amber-200";
}