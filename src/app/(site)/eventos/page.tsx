import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  MapPin,
  MonitorPlay,
  Church,
  Sparkles,
  MessageCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";
import { churchMedia } from "@/lib/church-media";

import {
  formatAppDateLong,
  getNextWeeklyOccurrence,
  isAppTodayOrFuture,
} from "@/lib/date-time";

/* =========================================================
   TIPOS
========================================================= */

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

type RegularEvent = {
  id: string;
  title: string;
  badge: string;
  date: string;
  time: string;
  location: string;
  description: string;
  icon: typeof MonitorPlay;
  whatsappText: string;
};

/* =========================================================
   FORMATEAR HORA
========================================================= */

function formatTime(time: string | null) {
  if (!time?.trim()) {
    return "Horario por confirmar";
  }

  return time;
}

/* =========================================================
   IMAGEN DEL EVENTO
========================================================= */

function getEventImage(
  event: EventRow,
  index: number
) {
  if (event.image_url?.trim()) {
    return event.image_url;
  }

  const gallery =
    churchMedia.gallery?.length
      ? churchMedia.gallery
      : [churchMedia.heroImage];

  return (
    gallery[index % gallery.length] ||
    churchMedia.heroImage
  );
}

/* =========================================================
   WHATSAPP
========================================================= */

function buildWhatsappUrl(
  whatsappNumber: string,
  message: string
) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;
}

function getSpecialEventUrl(
  whatsappNumber: string,
  event: EventRow
) {
  /*
   * Si el evento tiene un CTA específico en Supabase,
   * lo respetamos.
   *
   * Ejemplo:
   * Bautizos → Regístrate
   */
  if (event.cta_url?.trim()) {
    return event.cta_url;
  }

  return buildWhatsappUrl(
    whatsappNumber,
    `Hola, quiero solicitar información sobre el evento "${event.title}" de Comunidad VID.`
  );
}

/* =========================================================
   PÁGINA
========================================================= */

export default async function EventosPage() {
  const supabase = await createClient();

  const churchInfo =
    await getChurchInfo();

  const whatsappNumber =
    churchInfo?.whatsapp_number?.trim() ||
    "525520035631";

  const serviceAddress =
    churchInfo?.address ||
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";

  /* =========================================================
     PRÓXIMAS REUNIONES RECURRENTES
  ========================================================= */

  const sundayDate =
    getNextWeeklyOccurrence({
      weekday: 0,
      hour: 11,
      minute: 0,
    });

  const tuesdayDate =
    getNextWeeklyOccurrence({
      weekday: 2,
      hour: 20,
      minute: 0,
    });

  const thursdayDate =
    getNextWeeklyOccurrence({
      weekday: 4,
      hour: 20,
      minute: 0,
    });

  const regularEvents: RegularEvent[] = [
    {
      id: "tuesday-prayer",

      title: "Noche de oración",

      badge: "Oración",

      date: tuesdayDate,

      time:
        "Martes · 8:00 PM a 9:00 PM · En línea",

      location: "En línea",

      description:
        "Un tiempo especial para buscar a Dios juntos como iglesia.",

      icon: MonitorPlay,

      whatsappText:
        "Hola, quiero solicitar información sobre la noche de oración de Comunidad VID.",
    },

    {
      id: "thursday-prayer",

      title: "Noche de oración",

      badge: "Oración",

      date: thursdayDate,

      time:
        "Jueves · 8:00 PM a 9:00 PM · En línea",

      location: "En línea",

      description:
        "Un tiempo especial para buscar a Dios juntos como iglesia.",

      icon: MonitorPlay,

      whatsappText:
        "Hola, quiero solicitar información sobre la noche de oración de Comunidad VID.",
    },

    {
      id: "sunday-service",

      title: "Servicio dominical",

      badge: "Servicio",

      date: sundayDate,

      time:
        "Domingos · 11:00 AM · Presencial",

      location:
        serviceAddress,

      description:
        "Nuestra reunión principal de adoración, enseñanza bíblica y comunidad.",

      icon: Church,

      whatsappText:
        "Hola, quiero solicitar información sobre el servicio dominical de Comunidad VID.",
    },
  ].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  /* =========================================================
     EVENTOS ESPECIALES
  ========================================================= */

  const {
    data,
    error: eventsError,
  } = await supabase
    .from("events")
    .select("*")
    .order("event_date", {
      ascending: true,
    });

  if (eventsError) {
    console.error(
      "No se pudieron cargar los eventos:",
      eventsError.message
    );
  }

  const specialEvents =
    (
      (data ?? []) as EventRow[]
    )
      /*
       * Liderazgo continúa fuera
       * de la agenda pública.
       */
      .filter(
        (event) =>
          !event.title
            .toLowerCase()
            .includes("liderazgo")
      )

      /*
       * Sin fecha:
       * permanece como "Próximamente".
       *
       * Con fecha:
       * solamente hoy o futuro.
       */
      .filter((event) => {
        if (!event.event_date) {
          return true;
        }

        return isAppTodayOrFuture(
          event.event_date
        );
      })

      /*
       * Los eventos con fecha van primero.
       * Los pendientes de fecha van después.
       */
      .sort((a, b) => {
        if (
          a.event_date &&
          b.event_date
        ) {
          return a.event_date.localeCompare(
            b.event_date
          );
        }

        if (a.event_date) {
          return -1;
        }

        if (b.event_date) {
          return 1;
        }

        return a.title.localeCompare(
          b.title
        );
      });

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-8 px-4 py-6">
      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
          Agenda
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          Eventos
        </h1>

        <p className="text-sm leading-6 text-stone-600">
          Mantente al día con reuniones regulares,
          encuentros especiales y espacios de comunidad
          en Comunidad VID.
        </p>
      </section>

      {/* =====================================================
          REUNIONES REGULARES
      ===================================================== */}

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-950">
              Reuniones regulares
            </h2>

            <p className="text-sm leading-6 text-stone-600">
              Espacios semanales para crecer, conectar
              y caminar en comunidad.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {regularEvents.map(
            (event) => {
              const Icon =
                event.icon;

              const whatsappUrl =
                buildWhatsappUrl(
                  whatsappNumber,
                  event.whatsappText
                );

              return (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.06)]"
                >
                  {/* IMAGEN */}

                  <div
                    className="relative h-36"
                    style={{
                      backgroundImage: `url(${churchMedia.heroImage})`,
                      backgroundSize:
                        "cover",
                      backgroundPosition:
                        "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                    <div className="absolute bottom-4 left-4">
                      <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-900 backdrop-blur-sm">
                        {formatAppDateLong(
                          event.date
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {event.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-stone-950">
                      {event.title}
                    </h3>

                    <div className="mt-3 space-y-2 text-sm text-stone-600">
                      <div className="flex items-center gap-2">
                        <Clock3
                          size={15}
                          className="text-stone-400"
                        />

                        <span>
                          {event.time}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <Icon
                          size={15}
                          className="mt-0.5 shrink-0 text-stone-400"
                        />

                        <span>
                          {event.location}
                        </span>
                      </div>

                      <p className="pt-1 leading-6">
                        {event.description}
                      </p>
                    </div>

                    <div className="mt-4">
                      <Link
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
                      >
                        <MessageCircle
                          size={16}
                        />

                        Solicitar información
                      </Link>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      {/* =====================================================
          EVENTOS ESPECIALES
      ===================================================== */}

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <Sparkles size={20} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-950">
              Eventos especiales
            </h2>

            <p className="text-sm leading-6 text-stone-600">
              Actividades, reuniones y encuentros
              programados especialmente.
            </p>
          </div>
        </div>

        {/* SIN EVENTOS */}

        {specialEvents.length === 0 ? (
          <div className="rounded-[28px] border border-stone-200 bg-white p-6 text-center shadow-sm">
            <Sparkles
              size={26}
              className="mx-auto text-stone-300"
            />

            <p className="mt-3 font-semibold text-stone-800">
              Próximamente
            </p>

            <p className="mt-1 text-sm leading-6 text-stone-500">
              Muy pronto publicaremos nuevos eventos
              especiales de Comunidad VID.
            </p>
          </div>
        ) : null}

        <div className="space-y-4">
          {specialEvents.map(
            (event, index) => {
              const infoUrl =
                getSpecialEventUrl(
                  whatsappNumber,
                  event
                );

              const isUndated =
                !event.event_date;

              return (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.06)]"
                >
                  {/* IMAGEN */}

                  <div
                    className="relative h-44"
                    style={{
                      backgroundImage: `url(${getEventImage(
                        event,
                        index
                      )})`,
                      backgroundSize:
                        "cover",
                      backgroundPosition:
                        "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {isUndated ? (
                      <div className="absolute bottom-4 left-4">
                        <span className="rounded-full bg-amber-100/95 px-3 py-1.5 text-xs font-semibold text-amber-800 backdrop-blur-sm">
                          Próximamente
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                        Especial
                      </span>

                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                        {event.is_online
                          ? "En línea"
                          : "Presencial"}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-stone-950">
                      {event.title}
                    </h3>

                    <div className="mt-3 space-y-2 text-sm text-stone-600">
                      <div className="flex items-start gap-2">
                        <CalendarDays
                          size={15}
                          className="mt-0.5 shrink-0 text-stone-400"
                        />

                        <span className="capitalize">
                          {event.event_date
                            ? formatAppDateLong(
                                event.event_date
                              )
                            : "Fecha por confirmar"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock3
                          size={15}
                          className="text-stone-400"
                        />

                        <span>
                          {formatTime(
                            event.event_time
                          )}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        {event.is_online ? (
                          <MonitorPlay
                            size={15}
                            className="mt-0.5 shrink-0 text-stone-400"
                          />
                        ) : (
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0 text-stone-400"
                          />
                        )}

                        <span>
                          {event.location ||
                            (event.is_online
                              ? "En línea"
                              : "Sede por confirmar")}
                        </span>
                      </div>
                    </div>

                    {event.description ? (
                      <p className="mt-4 text-sm leading-6 text-stone-600">
                        {event.description}
                      </p>
                    ) : null}

                    <div className="mt-4">
                      <Link
                        href={infoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
                      >
                        <MessageCircle
                          size={16}
                        />

                        {event.cta_label ||
                          "Solicitar información"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>
    </div>
  );
}