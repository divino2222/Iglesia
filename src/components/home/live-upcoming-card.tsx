import Link from "next/link";
import {
  ArrowRight,
  Radio,
  HeartHandshake,
  WifiOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";
import { getUpcomingLiveItem } from "@/lib/upcoming-live";
import LiveStatusChip from "@/components/live/live-status-chip";
import LiveCountdownCard from "@/components/live/live-countdown-card";

type LiveStream = {
  id: number;
  title: string;
  description: string | null;
  youtube_embed_url: string;
  is_live: boolean | null;
  created_at: string;
};

export default async function LiveUpcomingCard() {
  const supabase = await createClient();
  const churchInfo = await getChurchInfo();

  const { data } = await supabase
    .from("live_stream")
    .select("*")
    .eq("is_live", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const stream = data as LiveStream | null;
  const churchName = churchInfo?.church_name ?? "Comunidad VID";
  const upcomingLive = await getUpcomingLiveItem();

  const whatsappNumber = churchInfo?.whatsapp_number?.trim() || "525520035631";
  const onlineRequestUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hola, me gustaría recibir acceso a la reunión en línea de ${churchName}.`
  )}`;

  if (stream && upcomingLive?.isActiveNow) {
    return (
      <Link
        href="/en-vivo"
        className="block overflow-hidden rounded-[30px] border border-red-200 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.06)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      >
        <div
          className="relative h-40"
          style={{
            backgroundImage: `url("/images/church-hero.jpg")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm">
            <Radio size={13} />
            En vivo ahora
          </div>
        </div>

        <div className="p-5">
          <h2 className="text-lg font-semibold text-stone-900">
            {stream.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            {stream.description ||
              `Conéctate con ${churchName} en nuestra transmisión.`}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700">
            Ver transmisión
            <ArrowRight size={16} />
          </div>
        </div>
      </Link>
    );
  }

  if (!upcomingLive) {
    return (
      <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
        <div
          className="relative h-36"
          style={{
            backgroundImage: `url("/images/church-hero.jpg")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm">
            <WifiOff size={13} />
            Offline
          </div>
        </div>

        <div className="p-5">
          <h2 className="text-lg font-semibold text-stone-900">
            No hay transmisión disponible
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Por ahora no hay una transmisión o reunión en línea activa.
          </p>
        </div>
      </div>
    );
  }

  if (!upcomingLive.isActiveNow) {
    return (
      <LiveCountdownCard
        startsAtIso={upcomingLive.startsAtIso}
        title={upcomingLive.title}
        dateLabel={upcomingLive.dateLabel}
        modeLabel={upcomingLive.modeLabel}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.06)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      <div
        className="relative h-36"
        style={{
          backgroundImage: `url("/images/church-hero.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/25" />

        <div className="absolute left-4 top-4">
          <LiveStatusChip
            startsAtIso={upcomingLive.startsAtIso}
            isJoinableNow={upcomingLive.isJoinableNow}
            isActiveNow={upcomingLive.isActiveNow}
          />
        </div>
      </div>

      <div className="p-5">
        <h2 className="text-lg font-semibold text-stone-900">
          {upcomingLive.title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-stone-600">
          {upcomingLive.description}
        </p>

        <p className="mt-3 text-sm font-medium text-stone-700">
          {upcomingLive.dateLabel} · {upcomingLive.modeLabel}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/en-vivo"
            className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
          >
            Ir a En vivo
            <ArrowRight size={16} />
          </Link>

          {upcomingLive.isJoinableNow ? (
            <Link
              href={onlineRequestUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            >
              <HeartHandshake size={16} />
              Solicitar acceso
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}