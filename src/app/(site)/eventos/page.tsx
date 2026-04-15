import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  MonitorPlay,
  Clock3,
  Sparkles,
  HeartHandshake,
  Users,
  Church,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";
import { churchMedia } from "@/lib/church-media";

type EventRow = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  event_time: string | null;
  image_url: string | null;
  is_online: boolean | null;
  is_streamable: boolean | null;
  stream_url: string | null;
};

type EventType = "servicio" | "oracion" | "liderazgo";

type RecurringEvent = {
  title: string;
  description: string;
  location: string;
  weekday: number;
  time: string;
  type: EventType;
  image: string;
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

  // Si es hoy pero ya pasó la hora de inicio, entonces sí lo manda a la próxima semana
  if (result.getTime() < baseDate.getTime()) {
    result.setDate(result.getDate() + 7);
  }

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

function formatEventDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getBadgeStyles(type: string) {
  switch (type) {
    case "servicio":
      return "bg-blue-100 text-blue-700";
    case "oracion":
      return "bg-emerald-100 text-emerald-700";
    case "liderazgo":
      return "bg-amber-100 text-amber-700";
    case "especial":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

function getTypeLabel(type: EventType) {
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

function getRegularEventImage(type: EventType) {
  switch (type) {
    case "servicio":
      return churchMedia.heroImage;
    case "oracion":
      return churchMedia.gallery[1] || churchMedia.heroImage;
    case "liderazgo":
      return churchMedia.gallery[0] || churchMedia.heroImage;
    default:
      return churchMedia.heroImage;
  }
}

function getSpecialEventImage(event: EventRow, index: number) {
  if (event.image_url?.trim()) return event.image_url;

  const gallery = churchMedia.gallery?.length
    ? churchMedia.gallery
    : [churchMedia.heroImage];

  return gallery[index % gallery.length] || churchMedia.heroImage;
}

export default async function EventsPage() {
  const supabase = await createClient();
  const churchInfo = await getChurchInfo();

  const serviceAddress =
    churchInfo?.address ??
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";

  const now = getMexicoCityNow();

  const recurringEvents: RecurringEvent[] = [
    {
      title: "Servicio dominical",
      description:
        "Nuestra reunión principal de adoración, enseñanza bíblica y comunidad.",
      location: serviceAddress,
      weekday: 0,
      time: "Domingos · 10:00 AM a 1:00 PM · Presencial",
      type: "servicio",
      image: getRegularEventImage("servicio"),
    },
    {
      title: "Noche de oración",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      location: "En línea",
      weekday: 2,
      time: "Martes · 9:00 PM a 10:00 PM · En línea",
      type: "oracion",
      image: getRegularEventImage("oracion"),
    },
    {
      title: "Grupo de liderazgo",
      description:
        "Espacio de formación, dirección y crecimiento para líderes.",
      location: "En línea",
      weekday: 3,
      time: "Miércoles · 8:00 PM a 9:00 PM · En línea",
      type: "liderazgo",
      image: getRegularEventImage("liderazgo"),
    },
    {
      title: "Noche de oración",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      location: "En línea",
      weekday: 4,
      time: "Jueves · 9:00 PM a 10:00 PM · En línea",
      type: "oracion",
      image: getRegularEventImage("oracion"),
    },
  ];

  const upcomingRegularEvents = recurringEvents
  .map((event) => {
    let hour = 0;
    let minute = 0;

    if (event.type === "servicio") {
      hour = 10;
      minute = 0;
    }

    if (event.type === "oracion") {
      hour = 21;
      minute = 0;
    }

    if (event.type === "liderazgo") {
      hour = 20;
      minute = 0;
    }

    return {
      ...event,
      date: getNextOccurrence(event.weekday, now, hour, minute),
    };
  })
  .sort((a, b) => a.date.getTime() - b.date.getTime());

  const { data } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  const specialEvents = ((data ?? []) as EventRow[]).filter((event) => {
    const eventDate = new Date(event.event_date);
    return eventDate >= new Date(now.toDateString());
  });

  const whatsappNumber = churchInfo?.whatsapp_number?.trim() || "525520035631";

  return (
    <div className="px-4 py-6">
      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
          Agenda
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950">
          Eventos
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Mantente al día con reuniones regulares, encuentros especiales y espacios de comunidad en Comunidad VID.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Church size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-950">
                Reuniones regulares
              </h2>
              <p className="text-sm text-stone-500">
                Espacios semanales para crecer, conectar y caminar en comunidad.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {upcomingRegularEvents.map((event, index) => {
              const { weekday, day } = formatCardDate(event.date);
              const isOnline = event.location === "En línea";
              const onlineRequestUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                `Hola, me gustaría recibir acceso a la reunión en línea de Comunidad VID.`
              )}`;

              return (
                <div
                  key={`${event.title}-${event.weekday}-${index}`}
                  className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
                >
                  <div
                    className="h-32"
                    style={{
                      backgroundImage: `url(${event.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />

                  <div className="p-5">
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
                            {getTypeLabel(event.type)}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-stone-900">
                          {event.title}
                        </h3>

                        <div className="mt-3 space-y-2 text-sm text-stone-600">
                          <div className="flex items-center gap-2">
                            <Clock3 size={15} className="text-stone-400" />
                            <span>{event.time}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isOnline ? (
                              <MonitorPlay size={15} className="text-stone-400" />
                            ) : (
                              <MapPin size={15} className="text-stone-400" />
                            )}
                            <span className="line-clamp-1">{event.location}</span>
                          </div>

                          <div className="flex items-start gap-2">
                            {event.type === "oracion" ? (
                              <HeartHandshake
                                size={15}
                                className="mt-0.5 text-stone-400"
                              />
                            ) : (
                              <Users size={15} className="mt-0.5 text-stone-400" />
                            )}
                            <span className="line-clamp-3 leading-6">
                              {event.description}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href="/eventos"
                            className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
                          >
                            Ver detalle
                            <ChevronRight size={16} />
                          </Link>

                          {isOnline ? (
                            <Link
                              href={onlineRequestUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                            >
                              <MonitorPlay size={16} />
                              Solicitar acceso
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-950">
                Eventos especiales
              </h2>
              <p className="text-sm text-stone-500">
                Actividades, reuniones y encuentros programados especialmente.
              </p>
            </div>
          </div>

          {specialEvents.length === 0 ? (
            <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-[0_14px_30px_rgba(0,0,0,0.06)]">
              <p className="text-sm text-stone-600">
                Por ahora no hay eventos especiales publicados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {specialEvents.map((event, index) => {
                const onlineRequestUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                  `Hola, me gustaría recibir acceso al evento en línea "${event.title}" de Comunidad VID.`
                )}`;

                return (
                  <div
                    key={event.id}
                    className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
                  >
                    <div
                      className="h-32"
                      style={{
                        backgroundImage: `url(${getSpecialEventImage(
                          event,
                          index
                        )})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />

                    <div className="p-5">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                          Especial
                        </span>

                        {event.is_online ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            En línea
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                            Presencial
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-stone-900">
                        {event.title}
                      </h3>

                      <div className="mt-3 space-y-2 text-sm text-stone-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={15} className="text-stone-400" />
                          <span>{formatEventDate(event.event_date)}</span>
                        </div>

                        {event.event_time ? (
                          <div className="flex items-center gap-2">
                            <Clock3 size={15} className="text-stone-400" />
                            <span>{event.event_time}</span>
                          </div>
                        ) : null}

                        <div className="flex items-center gap-2">
                          {event.is_online ? (
                            <MonitorPlay size={15} className="text-stone-400" />
                          ) : (
                            <MapPin size={15} className="text-stone-400" />
                          )}
                          <span>{event.location || "Por definir"}</span>
                        </div>
                      </div>

                      {event.description ? (
                        <p className="mt-3 text-sm leading-6 text-stone-600">
                          {event.description}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-3">
                        {event.is_online ? (
                          <Link
                            href={onlineRequestUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                          >
                            <MonitorPlay size={16} />
                            Solicitar acceso
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}