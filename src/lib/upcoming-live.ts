import { createClient } from "@/lib/supabase/server";

export type UpcomingLiveItem = {
  title: string;
  description: string;
  startsAtIso: string;
  endsAtIso: string;
  dateLabel: string;
  modeLabel: string;
  href: string;
  isActiveNow: boolean;
  isJoinableNow: boolean;
};

type SpecialEventRow = {
  id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  is_online: boolean | null;
  is_streamable: boolean | null;
  stream_url: string | null;
};

function getMexicoCityNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
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

function getNextOccurrence(
  targetWeekday: number,
  now: Date,
  startHour: number,
  startMinute: number,
  durationMinutes: number
) {
  const result = new Date(now);
  const currentWeekday = result.getDay();

  let diff = targetWeekday - currentWeekday;
  if (diff < 0) diff += 7;

  result.setDate(result.getDate() + diff);
  result.setHours(startHour, startMinute, 0, 0);

  const end = new Date(result.getTime() + durationMinutes * 60 * 1000);

  // si el evento de hoy ya terminó, brincar a la próxima semana
  if (end.getTime() <= now.getTime()) {
    result.setDate(result.getDate() + 7);
  }

  return {
    start: result,
    end: new Date(result.getTime() + durationMinutes * 60 * 1000),
  };
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });
}

export async function getUpcomingLiveItem(): Promise<UpcomingLiveItem | null> {
  const supabase = await createClient();
  const now = getMexicoCityNow();

  const regularCandidates = [
    {
      title: "Noche de oración",
      description: "Acompáñanos en nuestra reunión de oración en línea.",
      modeLabel: "En línea",
      href: "/en-vivo",
      ...getNextOccurrence(2, now, 21, 0, 60), // martes 9 a 10
    },
    {
      title: "Grupo de liderazgo en línea",
      description: "Espacio de formación, dirección y crecimiento para líderes.",
      modeLabel: "En línea",
      href: "/en-vivo",
      ...getNextOccurrence(3, now, 20, 0, 60), // miércoles 8 a 9
    },
    {
      title: "Noche de oración",
      description: "Acompáñanos en nuestra reunión de oración en línea.",
      modeLabel: "En línea",
      href: "/en-vivo",
      ...getNextOccurrence(4, now, 21, 0, 60), // jueves 9 a 10
    },
    {
      title: "Transmisión del servicio dominical",
      description: "Acompaña a Comunidad VID en nuestro servicio principal.",
      modeLabel: "Presencial + en vivo",
      href: "/en-vivo",
      ...getNextOccurrence(0, now, 10, 0, 180), // domingo 10 a 1
    },
  ];

  const { data } = await supabase
    .from("events")
    .select("id,title,description,event_date,event_time,is_online,is_streamable,stream_url")
    .eq("is_streamable", true)
    .order("event_date", { ascending: true });

  const specialStreamCandidates =
    ((data ?? []) as SpecialEventRow[])
      .filter((event) => !!event.event_date)
      .map((event) => {
        const parsed = parseTimeTo24Hour(event.event_time, 19, 0);
        const start = parseLocalDate(event.event_date as string);
        start.setHours(parsed.hour, parsed.minute, 0, 0);

        const end = new Date(start);
        end.setHours(end.getHours() + 2);

        return {
          title: event.title,
          description: event.description || "Evento especial en transmisión.",
          modeLabel: event.is_online ? "En línea" : "Transmisión especial",
          href: "/en-vivo",
          start,
          end,
        };
      })
      // solo deja eventos que no hayan terminado
      .filter((event) => event.end.getTime() > now.getTime());

  const allCandidates = [...regularCandidates, ...specialStreamCandidates].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  const next = allCandidates[0];
  if (!next) return null;

  const isActiveNow =
    now.getTime() >= next.start.getTime() && now.getTime() < next.end.getTime();

  return {
    title: next.title,
    description: next.description,
    startsAtIso: next.start.toISOString(),
    endsAtIso: next.end.toISOString(),
    dateLabel: formatDateLabel(next.start),
    modeLabel: next.modeLabel,
    href: next.href,
    isActiveNow,
    isJoinableNow: isActiveNow,
  };
}