import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  MonitorPlay,
  Users,
  ChevronRight,
} from "lucide-react";
import { getChurchInfo } from "@/lib/church-info";

type EventType = "servicio" | "oracion" | "liderazgo";

type RecurringEvent = {
  title: string;
  description: string;
  location: string;
  weekday: number;
  time: string;
  type: EventType;
};

type UpcomingEvent = RecurringEvent & {
  date: Date;
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
  if (diff <= 0) diff += 7;

  result.setDate(result.getDate() + diff);
  return result;
}

function formatCardDate(date: Date) {
  const weekday = date.toLocaleDateString("es-MX", {
    weekday: "short",
    timeZone: "America/Mexico_City",
  });

  const day = date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    timeZone: "America/Mexico_City",
  });

  return { weekday, day };
}

function getBadgeStyles(type: EventType) {
  switch (type) {
    case "servicio":
      return "bg-blue-100 text-blue-700";
    case "oracion":
      return "bg-emerald-100 text-emerald-700";
    case "liderazgo":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

function getBadgeLabel(type: EventType) {
  switch (type) {
    case "servicio":
      return "Servicio";
    case "oracion":
      return "Oración";
    case "liderazgo":
      return "Liderazgo";
    default:
      return "Evento";
  }
}

export default async function EventsSection() {
  const churchInfo = await getChurchInfo();

  const serviceAddress =
    churchInfo?.address ??
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";

  const recurringEvents: RecurringEvent[] = [
    {
      title: "Servicio dominical",
      description:
        "Nuestra reunión principal de adoración, enseñanza bíblica y comunidad.",
      location: serviceAddress,
      weekday: 0,
      time: churchInfo?.sunday_service_time ?? "10:00 AM · Presencial",
      type: "servicio",
    },
    {
      title: "Noche de oración",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      location: "En línea",
      weekday: 2,
      time: "9:00 PM",
      type: "oracion",
    },
    {
      title: "Grupo de liderazgo",
      description:
        "Espacio de formación, dirección y crecimiento para líderes.",
      location: "En línea",
      weekday: 3,
      time: churchInfo?.leadership_schedule ?? "8:00 PM",
      type: "liderazgo",
    },
    {
      title: "Noche de oración",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      location: "En línea",
      weekday: 4,
      time: "9:00 PM",
      type: "oracion",
    },
  ];

  const now = getMexicoCityNow();

  const upcomingEvents: UpcomingEvent[] = recurringEvents
    .map((event) => ({
      ...event,
      date: getNextOccurrence(event.weekday, now),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 2);

  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-stone-950">
          Próximos eventos
        </h2>

        <Link
          href="/eventos"
          className="inline-flex items-center gap-1 text-sm font-medium text-stone-700 hover:text-stone-900"
        >
          Ver todos
          <ChevronRight size={15} />
        </Link>
      </div>

      <div className="space-y-4">
        {upcomingEvents.map((event, index) => {
          const { weekday, day } = formatCardDate(event.date);

          return (
            <Link
              key={`${event.title}-${event.weekday}-${index}`}
              href="/eventos"
              className="block rounded-[28px] border border-stone-200 bg-white p-4 shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,0,0,0.09)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-stone-100 to-white ring-1 ring-stone-200">
                  <span className="text-[10px] font-semibold uppercase text-stone-500">
                    {weekday}
                  </span>
                  <span className="mt-1 text-base font-bold text-stone-900">
                    {day}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getBadgeStyles(
                        event.type
                      )}`}
                    >
                      {getBadgeLabel(event.type)}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-stone-900">
                    {event.title}
                  </h3>

                  <div className="mt-3 space-y-2 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={15} className="text-stone-400" />
                      <span>{event.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {event.location === "En línea" ? (
                        <MonitorPlay size={15} className="text-stone-400" />
                      ) : (
                        <MapPin size={15} className="text-stone-400" />
                      )}
                      <span className="line-clamp-1">{event.location}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users size={15} className="mt-0.5 text-stone-400" />
                      <span className="line-clamp-2 leading-6">
                        {event.description}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}