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
  endsAtIso: string;
  isActiveNow: boolean;
  isJoinableNow: boolean;
};

function getMexicoCityNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

function getNextOccurrence(targetWeekday: number, baseDate: Date) {
  const result = new Date(baseDate);
  const currentWeekday = result.getDay();

  let diff = targetWeekday - currentWeekday;
  if (diff < 0) diff += 7;

  result.setDate(result.getDate() + diff);
  return result;
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

function isNowBetween(now: Date, start: Date, end: Date) {
  return now.getTime() >= start.getTime() && now.getTime() < end.getTime();
}

function isJoinable(now: Date, start: Date, end: Date) {
  const earlyWindowMs = 10 * 60 * 1000;
  return now.getTime() >= start.getTime() - earlyWindowMs && now.getTime() < end.getTime();
}

export async function getUpcomingLiveItem(): Promise<UpcomingLiveItem | null> {
  const supabase = await createClient();
  await getChurchInfo(); // se mantiene por consistencia futura
  const now = getMexicoCityNow();

  // Horarios REALES
  const sundayStart = { hour: 10, minute: 0 };
  const sundayEnd = { hour: 13, minute: 0 };

  const prayerStart = { hour: 21, minute: 0 };
  const prayerEnd = { hour: 22, minute: 0 };

  const leadershipStart = { hour: 20, minute: 0 };
  const leadershipEnd = { hour: 21, minute: 0 };

  const nextSundayBase = getNextOccurrence(0, now);
  const nextTuesdayBase = getNextOccurrence(2, now);
  const nextWednesdayBase = getNextOccurrence(3, now);
  const nextThursdayBase = getNextOccurrence(4, now);

  const regularCandidates = [
    {
      title: "Transmisión del servicio dominical",
      description: "Acompaña a Comunidad VID en nuestro servicio principal.",
      start: buildDateTime(nextSundayBase, sundayStart.hour, sundayStart.minute),
      end: buildDateTime(nextSundayBase, sundayEnd.hour, sundayEnd.minute),
      dateLabel: "",
      modeLabel: "Presencial + en vivo",
      href: "/en-vivo",
    },
    {
      title: "Noche de oración en línea",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      start: buildDateTime(nextTuesdayBase, prayerStart.hour, prayerStart.minute),
      end: buildDateTime(nextTuesdayBase, prayerEnd.hour, prayerEnd.minute),
      dateLabel: "",
      modeLabel: "En línea",
      href: "/en-vivo",
    },
    {
      title: "Grupo de liderazgo en línea",
      description: "Espacio de formación, dirección y crecimiento para líderes.",
      start: buildDateTime(
        nextWednesdayBase,
        leadershipStart.hour,
        leadershipStart.minute
      ),
      end: buildDateTime(nextWednesdayBase, leadershipEnd.hour, leadershipEnd.minute),
      dateLabel: "",
      modeLabel: "En línea",
      href: "/eventos",
    },
    {
      title: "Noche de oración en línea",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      start: buildDateTime(nextThursdayBase, prayerStart.hour, prayerStart.minute),
      end: buildDateTime(nextThursdayBase, prayerEnd.hour, prayerEnd.minute),
      dateLabel: "",
      modeLabel: "En línea",
      href: "/en-vivo",
    },
  ].map((item) => ({
    ...item,
    dateLabel: formatDateLabel(item.start),
    isActiveNow: isNowBetween(now, item.start, item.end),
    isJoinableNow: isJoinable(now, item.start, item.end),
  }));

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

      // duración default de 2 horas para especiales si no tienes fin real guardado
      const endsAt = new Date(startsAt);
      endsAt.setHours(endsAt.getHours() + 2);

      return {
        title: event.title,
        description:
          event.description || "Evento especial transmitido por la iglesia.",
        start: startsAt,
        end: endsAt,
        dateLabel: formatSpecialDateLabel(event.event_date),
        modeLabel: event.is_online ? "En línea" : "Presencial + transmisión",
        href: event.is_streamable ? "/en-vivo" : "/eventos",
        isActiveNow: isNowBetween(now, startsAt, endsAt),
        isJoinableNow: isJoinable(now, startsAt, endsAt),
      };
    })
    .filter((event) => event.end.getTime() >= now.getTime());

  const allCandidates = [...regularCandidates, ...specialCandidates].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  const activeNow = allCandidates.find((item) => item.isActiveNow);
  const nextItem = activeNow ?? allCandidates[0];

  if (!nextItem) return null;

  return {
    title: nextItem.title,
    description: nextItem.description,
    dateLabel: nextItem.dateLabel,
    modeLabel: nextItem.modeLabel,
    href: nextItem.href,
    startsAtIso: nextItem.start.toISOString(),
    endsAtIso: nextItem.end.toISOString(),
    isActiveNow: nextItem.isActiveNow,
    isJoinableNow: nextItem.isJoinableNow,
  };
}