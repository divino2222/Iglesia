export const PRAYER_MEET_URL =
  "https://meet.google.com/kgw-ghii-ddc?authuser=8";

export type PrayerStatus = "confirmed" | "pending" | "unavailable";

export type PrayerScheduleItem = {
  date: string;
  leader: string;
  status: PrayerStatus;
};

export const prayerSchedule: PrayerScheduleItem[] = [
  { date: "2026-07-07", leader: "Ricardo Solís", status: "pending" },
  { date: "2026-07-09", leader: "Rosalía", status: "pending" },
  { date: "2026-07-14", leader: "Brenda alabanza", status: "pending" },
  { date: "2026-07-16", leader: "Eli alabanza", status: "pending" },
  { date: "2026-07-21", leader: "Sonia", status: "pending" },
  {
    date: "2026-07-23",
    leader: "Ricardo (Guitarra) alabanza",
    status: "pending",
  },
  { date: "2026-07-28", leader: "Luis alabanza", status: "pending" },
  { date: "2026-07-30", leader: "Alan", status: "pending" },
  { date: "2026-08-04", leader: "Ricardo (Bajo) alabanza", status: "pending" },
];