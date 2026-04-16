import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";

export type AppAnnouncement = {
  id: string;
  title: string;
  description: string;
  type: "general" | "evento" | "oracion" | "en-vivo" | "especial";
  source: "manual" | "regular_event" | "special_event";
  createdAt: string;
  isPriority?: boolean;
  href: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
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
  event_date: string | null;
  event_time: string | null;
  is_online: boolean | null;
  is_streamable: boolean | null;
  created_at: string;
  cta_label: string | null;
  cta_url: string | null;
  leader_name: string | null;
};

function getMexicoCityNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

function parseTimeTo24Hour(
  time: string | null | undefined,
  fallbackHour = 19,
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
  const parsed = parseTimeTo24Hour(timeStr, 19, 0);
  base.setHours(parsed.hour, parsed.minute, 0, 0);
  return base;
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

function normalizeAnnouncementType(
  value: string | null | undefined
): AppAnnouncement["type"] {
  if (value === "evento") return "evento";
  if (value === "oracion") return "oracion";
  if (value === "en-vivo") return "en-vivo";
  if (value === "especial") return "especial";
  return "general";
}

function getManualHref(type: AppAnnouncement["type"]) {
  switch (type) {
    case "en-vivo":
      return "/en-vivo";
    case "evento":
    case "especial":
      return "/eventos";
    case "oracion":
      return "/oracion";
    default:
      return "/";
  }
}

function formatSpecialEventDate(event: SpecialEvent) {
  if (!event.event_date) return "Próximamente en junio";

  return new Date(event.event_date).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export async function getAppAnnouncements(): Promise<AppAnnouncement[]> {
  const supabase = await createClient();
  await getChurchInfo();
  const now = getMexicoCityNow();

  const { data: manualData } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  const manualAnnouncements: AppAnnouncement[] = (
    (manualData ?? []) as ManualAnnouncement[]
  ).map((item) => {
    const type = normalizeAnnouncementType(item.type);

    return {
      id: `manual-${item.id}`,
      title: item.title,
      description: item.description ?? "",
      type,
      source: "manual" as const,
      createdAt: item.created_at,
      isPriority: false,
      href: getManualHref(type),
      ctaLabel: null,
      ctaUrl: null,
    };
  });

  const sundayStart = getNextOccurrenceWithTime(0, 10, 0, now);
  const wednesdayLeadershipStart = getNextOccurrenceWithTime(3, 20, 0, now);

  const regularAnnouncements: AppAnnouncement[] = [
    {
      id: "regular-sunday",
      title: "Servicio dominical próximo",
      description: `Te esperamos en Comunidad VID este domingo de 10:00 AM a 1:00 PM. ${formatAnnouncementDate(
        sundayStart
      )}.`,
      type: "evento" as const,
      source: "regular_event" as const,
      createdAt: sundayStart.toISOString(),
      isPriority: isWithinNextHours(sundayStart, now, 12),
      href: "/eventos",
      ctaLabel: null,
      ctaUrl: null,
    },
    {
      id: "regular-wednesday-leadership",
      title: "Grupo de liderazgo próximo",
      description: `Espacio de formación y dirección para líderes, miércoles de 8:00 PM a 9:00 PM. ${formatAnnouncementDate(
        wednesdayLeadershipStart
      )}.`,
      type: "general" as const,
      source: "regular_event" as const,
      createdAt: wednesdayLeadershipStart.toISOString(),
      isPriority: isWithinNextHours(wednesdayLeadershipStart, now, 12),
      href: "/eventos",
      ctaLabel: null,
      ctaUrl: null,
    },
  ].filter((item) => isWithinNextHours(new Date(item.createdAt), now, 72));

  const { data: specialData } = await supabase
    .from("events")
    .select(
      "id,title,description,location,event_date,event_time,is_online,is_streamable,created_at,cta_label,cta_url,leader_name"
    )
    .order("event_date", { ascending: true })
    .limit(30);

  const specialEvents = (specialData ?? []) as SpecialEvent[];

  const prayerLeaderAnnouncements: AppAnnouncement[] = specialEvents
    .filter((event) => event.title === "Noche de oración")
    .filter((event) => !!event.event_date)
    .map((event) => {
      const startsAt = buildDateTime(event.event_date as string, event.event_time);
      return {
        id: `prayer-${event.id}`,
        title: "Oración en línea próxima",
        description: `Dirige: ${event.leader_name || "Por confirmar"}. ${
          event.event_time || "9:00 PM"
        }. ${formatAnnouncementDate(startsAt)}.`,
        type: "oracion" as const,
        source: "special_event" as const,
        createdAt: startsAt.toISOString(),
        isPriority: isWithinNextHours(startsAt, now, 12),
        href: "/eventos",
        ctaLabel: null,
        ctaUrl: null,
      };
    })
    .filter((item) => isWithinNextHours(new Date(item.createdAt), now, 72))
    .slice(0, 2);

  const datedSpecialAnnouncements: AppAnnouncement[] = specialEvents
    .filter((event) => event.title !== "Noche de oración")
    .filter((event) => !!event.event_date)
    .map((event) => {
      const startsAt = buildDateTime(event.event_date as string, event.event_time);

      const type: AppAnnouncement["type"] = event.is_streamable
        ? "en-vivo"
        : event.is_online
        ? "oracion"
        : event.cta_label
        ? "especial"
        : "evento";

      return {
        id: `special-${event.id}`,
        title: event.title,
        description:
          event.description ||
          `Evento programado para ${formatAnnouncementDate(startsAt)}.`,
        type,
        source: "special_event" as const,
        createdAt: startsAt.toISOString(),
        isPriority: isWithinNextHours(startsAt, now, 12),
        href: event.is_streamable ? "/en-vivo" : "/eventos",
        ctaLabel: event.cta_label,
        ctaUrl: event.cta_url,
      };
    })
    .filter((item) => isWithinNextHours(new Date(item.createdAt), now, 72));

  const undatedSpecialAnnouncements: AppAnnouncement[] = specialEvents
    .filter((event) => !event.event_date)
    .map((event) => ({
      id: `special-undated-${event.id}`,
      title: event.title,
      description:
        event.description ||
        `${formatSpecialEventDate(event)}. Horario por confirmar.`,
      type: "especial" as const,
      source: "special_event" as const,
      createdAt: event.created_at,
      isPriority: true,
      href: "/eventos",
      ctaLabel: event.cta_label,
      ctaUrl: event.cta_url,
    }));

  const merged: AppAnnouncement[] = [
    ...manualAnnouncements,
    ...regularAnnouncements,
    ...prayerLeaderAnnouncements,
    ...datedSpecialAnnouncements,
    ...undatedSpecialAnnouncements,
  ];

  return merged.sort((a, b) => {
    const priorityDiff = Number(b.isPriority) - Number(a.isPriority);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}