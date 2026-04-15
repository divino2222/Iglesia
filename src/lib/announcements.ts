import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";

export type AppAnnouncement = {
  id: string;
  title: string;
  description: string;
  type: "general" | "evento" | "oracion" | "en-vivo";
  source: "manual" | "regular_event" | "special_event";
  createdAt: string;
  isPriority?: boolean;
};

type ManualAnnouncement = {
  id: number;
  title: string;
  description: string | null;
  type: string | null;
  is_active: boolean | null;
  created_at: string;
};

type SpecialEvent = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  event_time: string | null;
  is_online: boolean | null;
  is_streamable: boolean | null;
  created_at: string;
};

function getMexicoCityNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
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
  if (!time) return { hour: fallbackHour, minute: fallbackMinute };

  const normalized = time.toLowerCase().trim();
  const match = normalized.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);

  if (!match) return { hour: fallbackHour, minute: fallbackMinute };

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3];

  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  return { hour, minute };
}

function getNextOccurrenceWithTime(
  targetWeekday: number,
  hour: number,
  minute: number,
  now: Date
) {
  const result = new Date(now);
  const currentWeekday = result.getDay();

  let diff = targetWeekday - currentWeekday;
  if (diff < 0) diff += 7;

  result.setDate(result.getDate() + diff);
  result.setHours(hour, minute, 0, 0);

  if (result.getTime() < now.getTime()) {
    result.setDate(result.getDate() + 7);
  }

  return result;
}

function formatAnnouncementDate(date: Date) {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });
}

function isWithinNextHours(date: Date, now: Date, hours: number) {
  const diff = date.getTime() - now.getTime();
  return diff >= 0 && diff <= hours * 60 * 60 * 1000;
}

export async function getAppAnnouncements(): Promise<AppAnnouncement[]> {
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

  const leadershipTime = parseTimeTo24Hour(
    churchInfo?.leadership_schedule,
    20,
    0
  );

  const { data: manualData } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  const manualAnnouncements = ((manualData ?? []) as ManualAnnouncement[]).map(
    (item) => ({
      id: `manual-${item.id}`,
      title: item.title,
      description: item.description ?? "",
      type: (item.type as AppAnnouncement["type"]) || "general",
      source: "manual" as const,
      createdAt: item.created_at,
      isPriority: false,
    })
  );

  const regularCandidates = [
    {
      id: "regular-sunday",
      title: "Servicio dominical próximo",
      date: getNextOccurrenceWithTime(0, sundayTime.hour, sundayTime.minute, now),
      descriptionBase: "Te esperamos en Comunidad VID.",
      type: "evento" as const,
    },
    {
      id: "regular-tuesday-prayer",
      title: "Oración en línea próxima",
      date: getNextOccurrenceWithTime(2, prayerTime.hour, prayerTime.minute, now),
      descriptionBase: "Nuestra próxima noche de oración será en línea.",
      type: "oracion" as const,
    },
    {
      id: "regular-wednesday-leadership",
      title: "Grupo de liderazgo próximo",
      date: getNextOccurrenceWithTime(3, leadershipTime.hour, leadershipTime.minute, now),
      descriptionBase: "Espacio de formación y dirección para líderes.",
      type: "general" as const,
    },
    {
      id: "regular-thursday-prayer",
      title: "Oración en línea próxima",
      date: getNextOccurrenceWithTime(4, prayerTime.hour, prayerTime.minute, now),
      descriptionBase: "Nuestra próxima noche de oración será en línea.",
      type: "oracion" as const,
    },
  ];

  const regularAnnouncements: AppAnnouncement[] = regularCandidates
    .filter((item) => isWithinNextHours(item.date, now, 48))
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: `${item.descriptionBase} ${formatAnnouncementDate(item.date)}.`,
      type: item.type,
      source: "regular_event" as const,
      createdAt: item.date.toISOString(),
      isPriority: isWithinNextHours(item.date, now, 12),
    }));

  const { data: specialData } = await supabase
    .from("events")
    .select(
      "id,title,description,location,event_date,event_time,is_online,is_streamable,created_at"
    )
    .order("event_date", { ascending: true })
    .limit(10);

  const specialEvents = (specialData ?? []) as SpecialEvent[];

  const specialAnnouncements: AppAnnouncement[] = specialEvents
    .map((event) => {
      const parsed = parseTimeTo24Hour(event.event_time, 19, 0);
      const baseDate = new Date(event.event_date);
      const startsAt = buildDateTime(baseDate, parsed.hour, parsed.minute);

      return {
        id: `special-${event.id}`,
        title: event.title,
        description:
          event.description ||
          `Evento programado para ${formatAnnouncementDate(startsAt)}.`,
        type: event.is_streamable ? "en-vivo" : "evento",
        source: "special_event" as const,
        createdAt: startsAt.toISOString(),
        isPriority: isWithinNextHours(startsAt, now, 12),
        startsAt,
      };
    })
    .filter((item) => isWithinNextHours(item.startsAt, now, 72))
    .map(({ startsAt, ...rest }) => rest);

  const merged = [
    ...manualAnnouncements,
    ...regularAnnouncements,
    ...specialAnnouncements,
  ];

  return merged.sort((a, b) => {
    const priorityDiff = Number(b.isPriority) - Number(a.isPriority);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}