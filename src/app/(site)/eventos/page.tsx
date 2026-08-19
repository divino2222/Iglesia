import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  MapPin,
  MonitorPlay,
  Trophy,
  Church,
  Sparkles,
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

function getMexicoCityNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function formatDate(date: string | null) {
  if (!date) return "Fecha por confirmar";

  return parseLocalDate(date).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string | null) {
  if (!time?.trim()) return "Horario por confirmar";
  return time;
}

function getEventImage(event: EventRow, index: number) {
  if (event.image_url?.trim()) return event.image_url;

  const gallery = churchMedia.gallery?.length
    ? churchMedia.gallery
    : [churchMedia.heroImage];

  return gallery[index % gallery.length] || churchMedia.heroImage;
}

function getWhatsappUrl(
  whatsappNumber: string,
  eventTitle: string,
  customUrl?: string | null
) {
  if (customUrl?.trim()) return customUrl;

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hola, quiero solicitar información sobre el evento "${eventTitle}" de Comunidad VID.`
  )}`;
}

export default async function EventosPage() {
  const supabase = await createClient();
  const churchInfo = await getChurchInfo();
  const now = getMexicoCityNow();

  const whatsappNumber = churchInfo?.whatsapp_number?.trim() || "525520035631";

  const serviceAddress =
    churchInfo?.address ||
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";

  const sunday = new Date(now);
  const diff = (7 - sunday.getDay()) % 7;
  sunday.setDate(sunday.getDate() + diff);
  sunday.setHours(11, 0, 0, 0);

  if (sunday.getTime() < now.getTime()) {
    sunday.setDate(sunday.getDate() + 7);
  }

  const tuesday = new Date(now);
  let tuesdayDiff = 2 - tuesday.getDay();
  if (tuesdayDiff < 0) tuesdayDiff += 7;
  tuesday.setDate(tuesday.getDate() + tuesdayDiff);
  tuesday.setHours(20, 0, 0, 0);

  const thursday = new Date(now);
  let thursdayDiff = 4 - thursday.getDay();
  if (thursdayDiff < 0) thursdayDiff += 7;
  thursday.setDate(thursday.getDate() + thursdayDiff);
  thursday.setHours(20, 0, 0, 0);

  const regularEvents = [
    {
      title: "Noche de oración",
      badge: "Oración",
      date: tuesday,
      time: "Martes · 8:00 PM a 9:00 PM · En línea",
      location: "En línea",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      icon: MonitorPlay,
      whatsappText:
        "Hola, quiero solicitar información sobre la noche de oración de Comunidad VID.",
    },
    {
      title: "Noche de oración",
      badge: "Oración",
      date: thursday,
      time: "Jueves · 8:00 PM a 9:00 PM · En línea",
      location: "En línea",
      description: "Un tiempo especial para buscar a Dios juntos como iglesia.",
      icon: MonitorPlay,
      whatsappText:
        "Hola, quiero solicitar información sobre la noche de oración de Comunidad VID.",
    },
    {
      title: "Servicio dominical",
      badge: "Servicio",
      date: sunday,
      time: "Domingos · 11:00 AM · Presencial",
      location: serviceAddress,
      description:
        "Nuestra reunión principal de adoración, enseñanza bíblica y comunidad.",
      icon: Church,
      whatsappText:
        "Hola, quiero solicitar información sobre el servicio dominical de Comunidad VID.",
    },
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const { data } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  const specialEvents = ((data ?? []) as EventRow[])
    .filter((event) => !event.title.toLowerCase().includes("liderazgo"))
    .filter((event) => {
      if (!event.event_date) return true;

      const eventDate = parseLocalDate(event.event_date);
      eventDate.setHours(23, 59, 59, 999);

      return eventDate >= now;
    });

  return (
    <div className="space-y-8 px-4 py-6">
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
          Agenda
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          Eventos
        </h1>

        <p className="text-sm leading-6 text-stone-600">
          Mantente al día con reuniones regulares, encuentros especiales y
          espacios de comunidad en Comunidad VID.
        </p>
      </section>

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
              Espacios semanales para crecer, conectar y caminar en comunidad.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {regularEvents.map((event, index) => {
            const Icon = event.icon;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
              event.whatsappText
            )}`;

            return (
              <article
                key={`${event.title}-${index}`}
                className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.06)]"
              >
                <div
                  className="h-36"
                  style={{
                    backgroundImage: `url(${churchMedia.heroImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

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
                      <Clock3 size={15} className="text-stone-400" />
                      <span>{event.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Icon size={15} className="text-stone-400" />
                      <span>{event.location}</span>
                    </div>

                    <p className="pt-1 leading-6">{event.description}</p>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
                    >
                      Solicitar información
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

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
              Actividades, reuniones y encuentros programados especialmente.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {specialEvents.map((event, index) => {
            const infoUrl = getWhatsappUrl(
              whatsappNumber,
              event.title,
              event.cta_url
            );

            return (
              <article
                key={event.id}
                className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.06)]"
              >
                <div
                  className="h-40"
                  style={{
                    backgroundImage: `url(${getEventImage(event, index)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                <div className="p-5">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      Especial
                    </span>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                      Presencial
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-stone-950">
                    {event.title}
                  </h3>

                  <div className="mt-3 space-y-2 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={15} className="text-stone-400" />
                      <span>{formatDate(event.event_date)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 size={15} className="text-stone-400" />
                      <span>{formatTime(event.event_time)}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin
                        size={15}
                        className="mt-0.5 shrink-0 text-stone-400"
                      />
                      <span>{event.location || "Sede por confirmar"}</span>
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
                      className="inline-flex items-center justify-center rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
                    >
                      {event.cta_label || "Solicitar información"}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}