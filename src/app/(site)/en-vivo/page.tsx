import Link from "next/link";
import {
  Radio,
  PlayCircle,
  MonitorPlay,
  Wifi,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";
import { getUpcomingLiveItem } from "@/lib/upcoming-live";
import LiveStatusChip from "@/components/live/live-status-chip";
import LiveCountdownCard from "@/components/live/live-countdown-card";
import { churchMedia } from "@/lib/church-media";

type LiveStream = {
  id: number;
  title: string;
  description: string | null;
  youtube_embed_url: string;
  is_live: boolean | null;
  created_at: string;
};

type StreamEvent = {
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

function formatSpecialDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function LivePage() {
  const supabase = await createClient();
  const churchInfo = await getChurchInfo();

  const { data, error } = await supabase
    .from("live_stream")
    .select("*")
    .eq("is_live", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: streamEvent } = await supabase
    .from("events")
    .select("*")
    .eq("is_streamable", true)
    .not("stream_url", "is", null)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const stream = data as LiveStream | null;
  const eventStream = streamEvent as StreamEvent | null;
  const churchName = churchInfo?.church_name ?? "Comunidad VID";
  const upcomingLive = await getUpcomingLiveItem();

  return (
    <div className="px-4 py-6">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          En vivo
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Conéctate con {churchName} y acompáñanos en nuestra transmisión.
        </p>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
          No se pudo cargar la transmisión en este momento.
        </div>
      ) : !stream && !eventStream ? (
        <div className="space-y-4">
          {upcomingLive ? (
            <LiveCountdownCard
              startsAtIso={upcomingLive.startsAtIso}
              title={upcomingLive.title}
              dateLabel={upcomingLive.dateLabel}
              modeLabel={upcomingLive.modeLabel}
            />
          ) : null}

          <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)]">
            <div
              className="relative h-56"
              style={{
                backgroundImage: `url(${churchMedia.heroImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/35" />

              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm backdrop-blur">
                <MonitorPlay size={14} />
                No hay transmisión activa
              </div>
            </div>

            <div className="p-5">
              <h2 className="text-xl font-semibold text-stone-900">
                Próxima transmisión
              </h2>

              {upcomingLive ? (
                <>
                  <div className="mt-4">
                    <LiveStatusChip
                      startsAtIso={upcomingLive.startsAtIso}
                      isJoinableNow={upcomingLive.isJoinableNow}
                      isActiveNow={upcomingLive.isActiveNow}
                    />
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-stone-900">
                    {upcomingLive.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {upcomingLive.description}
                  </p>

                  <p className="mt-3 text-sm font-medium text-stone-700">
                    {upcomingLive.dateLabel} · {upcomingLive.modeLabel}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Por ahora no tenemos una transmisión próxima registrada.
                </p>
              )}

              <div className="mt-5">
                <Link
                  href="/predicaciones"
                  className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
                >
                  Ver predicaciones
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-start gap-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100">
                <Wifi size={18} className="text-stone-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Mantente atento
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Cuando la transmisión esté activa, aparecerá aquí automáticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : eventStream && !stream ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
            <div className="aspect-video w-full bg-black">
              <iframe
                className="h-full w-full"
                src={eventStream.stream_url ?? ""}
                title={eventStream.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-700">
                  <PlayCircle size={12} />
                  Evento especial
                </span>

                <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-700">
                  {eventStream.is_online ? "En línea" : "Presencial + transmisión"}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-stone-900">
                {eventStream.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-600">
                {eventStream.description || "Evento especial en transmisión."}
              </p>

              <div className="mt-4 space-y-1 text-sm text-stone-600">
                <p>{formatSpecialDate(eventStream.event_date)}</p>
                {eventStream.event_time ? <p>{eventStream.event_time}</p> : null}
                {eventStream.location ? <p>{eventStream.location}</p> : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={
                    eventStream.stream_url?.replace("/embed/", "/watch?v=") || "#"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
                >
                  <PlayCircle size={18} />
                  Abrir en YouTube
                </Link>

                <Link
                  href="/eventos"
                  className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
                >
                  Ver eventos
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
            <div className="aspect-video w-full bg-black">
              <iframe
                className="h-full w-full"
                src={stream!.youtube_embed_url}
                title={stream!.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold text-red-700">
                  <Radio size={12} />
                  En vivo ahora
                </span>

                <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-700">
                  Comunidad VID
                </span>
              </div>

              <h2 className="text-xl font-semibold text-stone-900">
                {stream!.title}
              </h2>

              {stream!.description ? (
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {stream!.description}
                </p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Acompáñanos en nuestra transmisión en vivo y sé parte de este
                  tiempo de adoración, palabra y comunidad.
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={stream!.youtube_embed_url.replace("/embed/", "/watch?v=")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
                >
                  <PlayCircle size={18} />
                  Abrir en YouTube
                </Link>

                <Link
                  href="/oracion"
                  className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
                >
                  Peticiones de oración
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-start gap-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100">
                <Radio size={18} className="text-red-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Transmisión activa
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Puedes ver la reunión desde aquí o abrirla directamente en
                  YouTube.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100">
                <Wifi size={18} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Participa desde donde estés
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Conéctate, comparte la transmisión y acompáñanos en comunidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}