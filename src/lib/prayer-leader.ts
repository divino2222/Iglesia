import { createClient } from "@/lib/supabase/server";

type PrayerLeaderEvent = {
  id: number;
  title: string;
  event_date: string | null;
  event_time: string | null;
  leader_name: string | null;
  is_online: boolean | null;
};

export type PrayerLeaderState = {
  currentLeader: string | null;
  nextLeader: string | null;
  nextDateLabel: string | null;
  isPrayerActiveNow: boolean;
};

function getMexicoCityNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

function parseTimeTo24Hour(
  time: string | null | undefined,
  fallbackHour = 21,
  fallbackMinute = 0
) {
  if (!time) return { hour: fallbackHour, minute: fallbackMinute };

  const normalized = time.toLowerCase().trim();

  const match12 = normalized.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
  if (match12) {
    let hour = Number(match12[1]);
    const minute = Number(match12[2]);
    const meridiem = match12[3];

    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    return { hour, minute };
  }

  const match24 = normalized.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    return {
      hour: Number(match24[1]),
      minute: Number(match24[2]),
    };
  }

  return { hour: fallbackHour, minute: fallbackMinute };
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function buildDateTime(dateStr: string, timeStr: string | null) {
  const base = parseLocalDate(dateStr);
  const parsed = parseTimeTo24Hour(timeStr, 21, 0);
  base.setHours(parsed.hour, parsed.minute, 0, 0);
  return base;
}

function formatSpanishDate(date: Date) {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });
}

export async function getPrayerLeaderState(): Promise<PrayerLeaderState> {
  const supabase = await createClient();
  const now = getMexicoCityNow();

  const { data } = await supabase
    .from("events")
    .select("id,title,event_date,event_time,leader_name,is_online")
    .eq("title", "Noche de oración")
    .order("event_date", { ascending: true });

  const prayerEvents = ((data ?? []) as PrayerLeaderEvent[])
    .filter((event) => !!event.event_date);

  let currentLeader: string | null = null;
  let nextLeader: string | null = null;
  let nextDateLabel: string | null = null;
  let isPrayerActiveNow = false;

  for (const event of prayerEvents) {
    if (!event.event_date) continue;

    const startsAt = buildDateTime(event.event_date, event.event_time);
    const endsAt = new Date(startsAt);
    endsAt.setHours(22, 0, 0, 0); // oración termina a las 10 PM

    if (now >= startsAt && now < endsAt) {
      currentLeader = event.leader_name ?? null;
      isPrayerActiveNow = true;
      break;
    }

    if (startsAt > now && !nextLeader) {
      nextLeader = event.leader_name ?? null;
      nextDateLabel = formatSpanishDate(startsAt);
      break;
    }
  }

  return {
    currentLeader,
    nextLeader,
    nextDateLabel,
    isPrayerActiveNow,
  };
}