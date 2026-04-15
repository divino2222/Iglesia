import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";

type SpecialEvent = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  event_time: string | null;
  is_online: boolean | null;
  is_streamable: boolean | null;
  stream_url: string | null;
};

export type UpcomingLiveItem = {
  title: string;
  description: string;
  dateLabel: string;
  modeLabel: string;
  href: string;
  startsAtIso: string;
  isJoinableNow: boolean;
  isActiveNow: boolean;
};

function getMexicoCityNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });
}

function formatSpecialDateLabel(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function buildDateTime(baseDate: Date, hour: number, minute: number) {
  const date = new Date(baseDate);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function parseTimeTo24Hour(
  time: string | null | undefined,
  fallbackHour = 19,
  fallbackMinute = 0
) {
  if (!time) {
    return { hour: fallbackHour, minute: fallbackMinute };
  }

  const normalized = time.toLowerCase().trim();
  const match = normalized.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);

  if (!match) {
    return { hour: fallbackHour, minute: fallbackMinute };
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3];

  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  return { hour, minute };
}

function isWithinActiveWindow(startsAt: Date, now: Date) {
  const diff = now.getTime() - startsAt.getTime();
  return diff >= 0 && diff <= 2 * 60 * 60 * 1000;
}

function getClosestWeeklyOccurrence(
  weekday: number,
  hour: number,
  minute: number,
  now: Date
) {
  const currentWeekDate = new Date(now);
  const diffToTarget = weekday - currentWeekDate.getDay();
  currentWeekDate.setDate(currentWeekDate.getDate() + diffToTarget);

  const thisWeekOccurrence = buildDateTime(currentWeekDate, hour, minute);

  if (isWithinActiveWindow(thisWeekOccurrence, now)) {
    return thisWeekOccurrence;
  }

  if (thisWeekOccurrence.getTime() >= now.getTime()) {
    return thisWeekOccurrence;
  }

  const nextWeekOccurrence = new Date(thisWeekOccurrence);
  nextWeekOccurrence.setDate(nextWeekOccurrence.getDate() + 7);
  return nextWeekOccurrence;
}

export async function getUpcomingLiveItem(): Promise<UpcomingLiveItem | null> {
  const supabase = await createClient();
  const churchInfo = await getChurchInfo();
  const now = getMexicoCityNow();

  const sundayTime = parseTimeTo24Hour(
    churchInfo?.sunday_service_time,
    10,
    0
  );

  const prayerTime = parseTimeTo24Hour(
    churchInfo?.prayer_schedule,
    21,
    0
  );

  const sundayOccurrence = getClosestWeeklyOccurrence(
    0,
    sundayTime.hour,
    sundayTime.minute,
    now
  );
  const tuesdayOccurrence = getClosestWeeklyOccurrence(
    2,
    prayerTime.hour,
    prayerTime.minute,
    now
  );
  const thursdayOccurrence = getClosestWeeklyOccurrence(
    4,
    prayerTime.hour,
    prayerTime.minute,
    now
  );

  const regularCandidates = [
    {
      title: "Transmisión del servicio dominical",
      description: `Acompaña a ${
        churchInfo?.church_name ?? "Comunidad VID"
      } en nuestro servicio principal.`,
      date: sundayOccurrence,
      dateLabel: formatDateLabel(sundayOccurrence),
      modeLabel: "Presencial + en vivo",
      href: "/en-vivo",
      isActiveNow: isWithinActiveWindow(sundayOccurrence, now),
      isJoinableNow: false,
    },
    {
      title: "Noche de oración en línea",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      date: tuesdayOccurrence,
      dateLabel: formatDateLabel(tuesdayOccurrence),
      modeLabel: "En línea",
      href: "/en-vivo",
      isActiveNow: isWithinActiveWindow(tuesdayOccurrence, now),
      isJoinableNow: isWithinActiveWindow(tuesdayOccurrence, now),
    },
    {
      title: "Noche de oración en línea",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      date: thursdayOccurrence,
      dateLabel: formatDateLabel(thursdayOccurrence),
      modeLabel: "En línea",
      href: "/en-vivo",
      isActiveNow: isWithinActiveWindow(thursdayOccurrence, now),
      isJoinableNow: isWithinActiveWindow(thursdayOccurrence, now),
    },
  ];

  const { data } = await supabase
    .from("events")
    .select(
      "id,title,description,location,event_date,event_time,is_online,is_streamable,stream_url"
    )
    .eq("is_streamable", true)
    .order("event_date", { ascending: true });

  const specialEvents = (data ?? []) as SpecialEvent[];

  const specialCandidates = specialEvents
    .map((event) => {
      const parsed = parseTimeTo24Hour(event.event_time, 19, 0);
      const baseDate = new Date(event.event_date);
      const startsAt = buildDateTime(baseDate, parsed.hour, parsed.minute);
      const activeNow = isWithinActiveWindow(startsAt, now);

      return {
        title: event.title,
        description:
          event.description || "Evento especial transmitido por la iglesia.",
        date: startsAt,
        dateLabel: formatSpecialDateLabel(event.event_date),
        modeLabel: event.is_online ? "En línea" : "Presencial + transmisión",
        href: "/en-vivo",
        isActiveNow: activeNow,
        isJoinableNow: event.is_online ? activeNow : false,
      };
    })
    .filter((event) => event.date.getTime() >= now.getTime() - 2 * 60 * 60 * 1000);

  const allCandidates = [...regularCandidates, ...specialCandidates].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const nextItem = allCandidates[0];
  if (!nextItem) return null;

  return {
    title: nextItem.title,
    description: nextItem.description,
    dateLabel: nextItem.dateLabel,
    modeLabel: nextItem.modeLabel,
    href: nextItem.href,
    startsAtIso: nextItem.date.toISOString(),
    isJoinableNow: nextItem.isJoinableNow,
    isActiveNow: nextItem.isActiveNow,
  };
}