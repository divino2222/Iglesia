import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  MonitorPlay,
  Sparkles,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";
import { churchMedia } from "@/lib/church-media";

type EventRow = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string | null;
  event_time: string | null;
  image_url: string | null;
  is_online: boolean | null;
  is_streamable: boolean | null;
  stream_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
};

type RegularHomeEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  displayDate: {
    weekday: string;
    day: string;
  };
  displayTime: string;
  badge: string;
  badgeClass: string;
  modeIcon: "online" | "location";
};

function getMexicoCityNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

function getNextOccurrence(
  targetWeekday: number,
  baseDate: Date,
  eventHour = 0,
  eventMinute = 0
) {
  const result = new Date(baseDate);
  const currentWeekday = result.getDay();

  let diff = targetWeekday - currentWeekday;
  if (diff < 0) diff += 7;

  result.setDate(result.getDate() + diff);
  result.setHours(eventHour, eventMinute, 0, 0);

  if (result.getTime() < baseDate.getTime()) {
    result.setDate(result.getDate() + 7);
  }

  return result;
}

function formatCardDate(date: Date) {
  return {
    weekday: date.toLocaleDateString("es-MX", {
      weekday: "short",
      timeZone: "America/Mexico_City",
    }),
    day: date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      timeZone: "America/Mexico_City",
    }),
  };
}

function formatSpecialDate(date: string | null) {
  if (!date) return "Próximamente en junio";

  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatSpecialTime(time: string | null) {
  if (!time?.trim()) return "Horario por confirmar";
  return time;
}

function getSpecialImage(event: EventRow, index: number) {
  if (event.image_url?.trim()) return event.image_url;

  const gallery = churchMedia.gallery?.length
    ? churchMedia.gallery
    : [churchMedia.heroImage];

  return gallery[index % gallery.length] || churchMedia.heroImage;
}

export default async function EventsSection() {
  const supabase = await createClient();
  const churchInfo = await getChurchInfo();
  const now = getMexicoCityNow();

  const serviceAddress =
    churchInfo?.address ??
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";

  const whatsappNumber = churchInfo?.whatsapp_number?.trim() || "525520035631";

  const regularEvents: RegularHomeEvent[] = [
    {
      id: "regular-sunday",
      title: "Servicio dominical",
      description:
        "Nuestra reunión principal de adoración, enseñanza bíblica y comunidad.",
      location: serviceAddress,
      date: getNextOccurrence(0, now, 10, 0),
      displayDate: formatCardDate(getNextOccurrence(0, now, 10, 0)),
      displayTime: "Domingos · 10:00 AM a 1:00 PM · Presencial",
      badge: "Servicio",
      badgeClass: "bg-blue-100 text-blue-700",
      modeIcon: "location",
    },
    {
      id: "regular-tuesday-prayer",
      title: "Noche de oración",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      location: "En línea",
      date: getNextOccurrence(2, now, 21, 0),
      displayDate: formatCardDate(getNextOccurrence(2, now, 21, 0)),
      displayTime: "Martes · 9:00 PM a 10:00 PM · En línea",
      badge: "Oración",
      badgeClass: "bg-emerald-100 text-emerald-700",
      modeIcon: "online",
    },
    {
      id: "regular-wednesday-leadership",
      title: "Grupo de liderazgo",
      description: "Espacio de formación, dirección y crecimiento para líderes.",
      location: "En línea",
      date: getNextOccurrence(3, now, 20, 0),
      displayDate: formatCardDate(getNextOccurrence(3, now, 20, 0)),
      displayTime: "Miércoles · 8:00 PM a 9:00 PM · En línea",
      badge: "Liderazgo",
      badgeClass: "bg-amber-100 text-amber-700",
      modeIcon: "online",
    },
    {
      id: "regular-thursday-prayer",
      title: "Noche de oración",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      location: "En línea",
      date: getNextOccurrence(4, now, 21, 0),
      displayDate: formatCardDate(getNextOccurrence(4, now, 21, 0)),
      displayTime: "Jueves · 9:00 PM a 10:00 PM · En línea",
      badge: "Oración",
      badgeClass: "bg-emerald-100 text-emerald-700",
      modeIcon: "online",
    },
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const nextRegularEvent = regularEvents[0] ?? null;

  const { data } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  const rawSpecialEvents = (data ?? []) as EventRow[];

  const datedSpecialEvents = rawSpecialEvents
    .filter((event) => event.event_date)
    .filter((event) => new Date(event.event_date as string) >= now)
    .sort(
      (a, b) =>
        new Date(a.event_date as string).getTime() -
        new Date(b.event_date as string).getTime()
    );

  const undatedSpecialEvents = rawSpecialEvents.filter((event) => !event.event_date);

  const homeSpecialEvents = [
    ...datedSpecialEvents.slice(0, 1),
    ...undatedSpecialEvents,
  ].slice(0, 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-stone-950">
          Próximos eventos
        </h3>

        <Link
          href="/eventos"
          className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 transition hover:text-stone-900"
        >
          Ver todos
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="space-y-4">
        {nextRegularEvent ? (
          <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
            <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 p-4 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
                <CalendarDays size={12} />
                Próximo evento
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-[78px] w-[78px] shrink-0 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-stone-100 to-white ring-1 ring-stone-200">
                  <span className="text-[10px] font-semibold uppercase text-stone-500">
                    {nextRegularEvent.displayDate.weekday}
                  </span>
                  <span className="mt-1 text-lg font-bold text-stone-900">
                    {nextRegularEvent.displayDate.day}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${nextRegularEvent.badgeClass}`}
                    >
                      {nextRegularEvent.badge}
                    </span>
                  </div>

                  <h4 className="text-xl font-semibold text-stone-900">
                    {nextRegularEvent.title}
                  </h4>

                  <div className="mt-3 space-y-2 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                      <Clock3 size={15} className="text-stone-400" />
                      <span>{nextRegularEvent.displayTime}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {nextRegularEvent.modeIcon === "online" ? (
                        <MonitorPlay size={15} className="text-stone-400" />
                      ) : (
                        <MapPin size={15} className="text-stone-400" />
                      )}
                      <span className="line-clamp-1">
                        {nextRegularEvent.location}
                      </span>
                    </div>

                    <p className="pt-1 leading-6 text-stone-600">
                      {nextRegularEvent.description}
                    </p>
                  </div>

                  <div className="mt-4">
                    <Link
                      href="/eventos"
                      className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
                    >
                      Ver detalle
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {homeSpecialEvents.map((event, index) => {
          const isUndated = !event.event_date;
          const registerUrl =
            event.cta_url ||
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
              `Hola, quiero registrarme al evento "${event.title}" de Comunidad VID.`
            )}`;

          return (
            <div
              key={`special-home-${event.id}`}
              className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl"
            >
              <div
                className="h-32"
                style={{
                  backgroundImage: `url(${getSpecialImage(event, index)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              <div className="p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                    Especial
                  </span>

                  {isUndated ? (
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      Próximamente
                    </span>
                  ) : null}
                </div>

                <h4 className="text-lg font-semibold text-stone-900">
                  {event.title}
                </h4>

                <div className="mt-3 space-y-2 text-sm text-stone-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={15} className="text-stone-400" />
                    <span>{formatSpecialDate(event.event_date)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock3 size={15} className="text-stone-400" />
                    <span>{formatSpecialTime(event.event_time)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Trophy size={15} className="text-stone-400" />
                    <span>{event.location || "Sede por confirmar"}</span>
                  </div>
                </div>

                {event.description ? (
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {event.description}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/eventos"
                    className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
                  >
                    Ver detalle
                  </Link>

                  <Link
                    href={registerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
                  >
                    {event.cta_label || "Regístrate"}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}