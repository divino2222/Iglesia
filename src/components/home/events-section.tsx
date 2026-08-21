import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  MonitorPlay,
  Trophy,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";
import { churchMedia } from "@/lib/church-media";

import {
  formatAppCardDate,
  formatAppDate,
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

type RegularHomeEvent = {
  id: string;
  title: string;
  description: string;
  location: string;

  /*
   * Ahora usamos YYYY-MM-DD,
   * no Date del servidor.
   */
  date: string;

  displayDate: {
    weekday: string;
    day: string;
  };

  displayTime: string;

  badge: string;

  badgeClass: string;

  modeIcon:
    | "online"
    | "location";

  whatsappMessage: string;
};

/* =========================================================
   FECHA EVENTO ESPECIAL
========================================================= */

function formatSpecialDate(
  date: string | null
) {
  if (!date) {
    return "Fecha por confirmar";
  }

  return formatAppDate(
    date,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  );
}

/* =========================================================
   HORA EVENTO ESPECIAL
========================================================= */

function formatSpecialTime(
  time: string | null
) {
  if (!time?.trim()) {
    return "Horario por confirmar";
  }

  return time;
}

/* =========================================================
   IMAGEN EVENTO ESPECIAL
========================================================= */

function getSpecialImage(
  event: EventRow,
  index: number
) {
  if (
    event.image_url?.trim()
  ) {
    return event.image_url;
  }

  const gallery =
    churchMedia.gallery?.length
      ? churchMedia.gallery
      : [
          churchMedia.heroImage,
        ];

  return (
    gallery[
      index %
        gallery.length
    ] ||
    churchMedia.heroImage
  );
}

/* =========================================================
   WHATSAPP
========================================================= */

function buildWhatsAppUrl(
  whatsappNumber: string,
  message: string
) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;
}

/* =========================================================
   COMPONENTE
========================================================= */

export default async function EventsSection() {
  const supabase =
    await createClient();

  const churchInfo =
    await getChurchInfo();

  const serviceAddress =
    churchInfo?.address ??
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";

  const whatsappNumber =
    churchInfo?.whatsapp_number?.trim() ||
    "525520035631";

  /* =========================================================
     EVENTOS RECURRENTES
  ========================================================= */

  /*
   * Domingo 11:00 AM.
   *
   * Si hoy es domingo pero ya pasaron
   * las 11:00 AM, devuelve el siguiente.
   */
  const sundayDate =
    getNextWeeklyOccurrence({
      weekday: 0,
      hour: 11,
      minute: 0,
    });

  /*
   * Martes 8:00 PM.
   */
  const tuesdayPrayerDate =
    getNextWeeklyOccurrence({
      weekday: 2,
      hour: 20,
      minute: 0,
    });

  /*
   * Jueves 8:00 PM.
   */
  const thursdayPrayerDate =
    getNextWeeklyOccurrence({
      weekday: 4,
      hour: 20,
      minute: 0,
    });

  const regularEvents:
    RegularHomeEvent[] = [
      {
        id:
          "regular-sunday",

        title:
          "Servicio dominical",

        description:
          "Nuestra reunión principal de adoración, enseñanza bíblica y comunidad.",

        location:
          serviceAddress,

        date:
          sundayDate,

        displayDate:
          formatAppCardDate(
            sundayDate
          ),

        displayTime:
          "Domingos · 11:00 AM · Presencial",

        badge:
          "Servicio",

        badgeClass:
          "bg-blue-100 text-blue-700",

        modeIcon:
          "location",

        whatsappMessage:
          "Hola, quiero información para asistir al servicio dominical de Comunidad VID.",
      },

      {
        id:
          "regular-tuesday-prayer",

        title:
          "Noche de oración",

        description:
          "Un tiempo especial para buscar a Dios juntos como iglesia.",

        location:
          "En línea",

        date:
          tuesdayPrayerDate,

        displayDate:
          formatAppCardDate(
            tuesdayPrayerDate
          ),

        displayTime:
          "Martes · 8:00 PM a 9:00 PM · En línea",

        badge:
          "Oración",

        badgeClass:
          "bg-emerald-100 text-emerald-700",

        modeIcon:
          "online",

        whatsappMessage:
          "Hola, quiero información sobre la oración en línea de Comunidad VID.",
      },

      {
        id:
          "regular-thursday-prayer",

        title:
          "Noche de oración",

        description:
          "Un tiempo especial para buscar a Dios juntos como iglesia.",

        location:
          "En línea",

        date:
          thursdayPrayerDate,

        displayDate:
          formatAppCardDate(
            thursdayPrayerDate
          ),

        displayTime:
          "Jueves · 8:00 PM a 9:00 PM · En línea",

        badge:
          "Oración",

        badgeClass:
          "bg-emerald-100 text-emerald-700",

        modeIcon:
          "online",

        whatsappMessage:
          "Hola, quiero información sobre la oración en línea de Comunidad VID.",
      },
    ];

  /*
   * Como YYYY-MM-DD ordena
   * cronológicamente por texto,
   * no necesitamos Date.
   */
  regularEvents.sort(
    (a, b) =>
      a.date.localeCompare(
        b.date
      )
  );

  const nextRegularEvent =
    regularEvents[0] ??
    null;

  /* =========================================================
     EVENTOS ESPECIALES DESDE SUPABASE
  ========================================================= */

  const {
    data,
    error: eventsError,
  } = await supabase
    .from("events")
    .select("*")
    .order(
      "event_date",
      {
        ascending: true,
      }
    );

  /*
   * Si Supabase falla,
   * seguimos mostrando los
   * eventos recurrentes.
   */
  const specialRows =
    eventsError
      ? []
      : ((data ?? []) as EventRow[]);

  /*
   * Liderazgo sigue fuera,
   * como habíamos acordado.
   */
  const rawSpecialEvents =
    specialRows.filter(
      (event) =>
        !event.title
          .toLowerCase()
          .includes(
            "liderazgo"
          )
    );

  /* =========================================================
     EVENTOS CON FECHA
  ========================================================= */

  const datedSpecialEvents =
    rawSpecialEvents
      .filter(
        (event) =>
          Boolean(
            event.event_date
          )
      )
      .filter(
        (event) =>
          event.event_date
            ? isAppTodayOrFuture(
                event.event_date
              )
            : false
      )
      .sort((a, b) =>
        String(
          a.event_date
        ).localeCompare(
          String(
            b.event_date
          )
        )
      );

  /* =========================================================
     EVENTOS SIN FECHA
  ========================================================= */

  const undatedSpecialEvents =
    rawSpecialEvents.filter(
      (event) =>
        !event.event_date
    );

  /*
   * Home:
   * máximo 3 especiales.
   */
  const homeSpecialEvents =
    [
      ...datedSpecialEvents.slice(
        0,
        2
      ),

      ...undatedSpecialEvents,
    ].slice(
      0,
      3
    );

  /* =========================================================
     RENDER
  ========================================================= */

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

          <ChevronRight
            size={16}
          />
        </Link>
      </div>

      <div className="space-y-4">
        {/* ===================================================
            PRÓXIMO EVENTO RECURRENTE
        =================================================== */}

        {nextRegularEvent ? (
          <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
            <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 p-4 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
                <CalendarDays
                  size={12}
                />

                Próximo evento
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-[78px] w-[78px] shrink-0 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-stone-100 to-white ring-1 ring-stone-200">
                  <span className="text-[10px] font-semibold uppercase text-stone-500">
                    {
                      nextRegularEvent
                        .displayDate
                        .weekday
                    }
                  </span>

                  <span className="mt-1 text-lg font-bold text-stone-900">
                    {
                      nextRegularEvent
                        .displayDate
                        .day
                    }
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${nextRegularEvent.badgeClass}`}
                    >
                      {
                        nextRegularEvent
                          .badge
                      }
                    </span>
                  </div>

                  <h4 className="text-xl font-semibold text-stone-900">
                    {
                      nextRegularEvent
                        .title
                    }
                  </h4>

                  <div className="mt-3 space-y-2 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                      <Clock3
                        size={15}
                        className="text-stone-400"
                      />

                      <span>
                        {
                          nextRegularEvent
                            .displayTime
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {nextRegularEvent.modeIcon ===
                      "online" ? (
                        <MonitorPlay
                          size={15}
                          className="text-stone-400"
                        />
                      ) : (
                        <MapPin
                          size={15}
                          className="text-stone-400"
                        />
                      )}

                      <span className="line-clamp-1">
                        {
                          nextRegularEvent
                            .location
                        }
                      </span>
                    </div>

                    <p className="pt-1 leading-6 text-stone-600">
                      {
                        nextRegularEvent
                          .description
                      }
                    </p>
                  </div>

                  {/* CTA WHATSAPP */}

                  <div className="mt-4">
                    <Link
                      href={buildWhatsAppUrl(
                        whatsappNumber,
                        nextRegularEvent.whatsappMessage
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
                    >
                      <MessageCircle
                        size={16}
                      />

                      Solicitar información
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ===================================================
            EVENTOS ESPECIALES
        =================================================== */}

        {homeSpecialEvents.map(
          (
            event,
            index
          ) => {
            const isUndated =
              !event.event_date;

            /*
             * Si Supabase ya tiene un CTA,
             * lo respetamos.
             *
             * Si no tiene, WhatsApp.
             */
            const contactUrl =
              event.cta_url?.trim() ||
              buildWhatsAppUrl(
                whatsappNumber,
                `Hola, quiero solicitar información sobre el evento "${event.title}" de Comunidad VID.`
              );

            /*
             * Si pusiste un texto específico
             * como "Regístrate", lo conservamos.
             *
             * Si no, mostramos el nuevo CTA.
             */
            const contactLabel =
              event.cta_label?.trim() ||
              "Solicitar información";

            return (
              <div
                key={`special-home-${event.id}`}
                className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl"
              >
                <div
                  className="h-32"
                  style={{
                    backgroundImage: `url(${getSpecialImage(
                      event,
                      index
                    )})`,
                    backgroundSize:
                      "cover",
                    backgroundPosition:
                      "center",
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
                      <CalendarDays
                        size={15}
                        className="text-stone-400"
                      />

                      <span>
                        {formatSpecialDate(
                          event.event_date
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3
                        size={15}
                        className="text-stone-400"
                      />

                      <span>
                        {formatSpecialTime(
                          event.event_time
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Trophy
                        size={15}
                        className="text-stone-400"
                      />

                      <span>
                        {event.location ||
                          "Sede por confirmar"}
                      </span>
                    </div>
                  </div>

                  {event.description ? (
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {
                        event.description
                      }
                    </p>
                  ) : null}

                  {/* UN SOLO CTA */}

                  <div className="mt-4">
                    <Link
                      href={
                        contactUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
                    >
                      <MessageCircle
                        size={16}
                      />

                      {
                        contactLabel
                      }
                    </Link>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}