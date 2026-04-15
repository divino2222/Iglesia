import Link from "next/link";
import { ArrowRight, Users, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";
import { churchMedia } from "@/lib/church-media";

type HomeHeroData = {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_href: string | null;
  is_active: boolean | null;
  created_at: string;
};

export default async function HomeHero() {
  const supabase = await createClient();
  const churchInfo = await getChurchInfo();

  const { data } = await supabase
    .from("home_hero")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hero = data as HomeHeroData | null;
  const churchName = churchInfo?.church_name ?? "Comunidad VID";
  const welcomeMessage =
    churchInfo?.welcome_message ?? "Un lugar para crecer, creer y pertenecer";

  const title = hero?.title || `Bienvenido a ${churchName}`;
  const subtitle = hero?.subtitle || welcomeMessage;
  const ctaText = hero?.cta_text || "Planifica tu visita";
  const ctaHref = hero?.cta_href || "/visita";

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-[32px] shadow-[0_24px_48px_rgba(0,0,0,0.18)] transition-all duration-300 hover:shadow-2xl"
        style={{
          backgroundImage: `url(${churchMedia.heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_30%)]" />

        <div className="relative z-10 flex min-h-[260px] flex-col justify-end p-5 text-white">
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur">
            {churchName}
          </div>

          <h2 className="max-w-[92%] text-[30px] font-semibold leading-tight tracking-tight">
            {title}
          </h2>

          <p className="mt-3 max-w-[90%] text-sm leading-6 text-white/90">
            {subtitle}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-900 shadow-sm transition-all duration-300 hover:scale-[1.02]"
            >
              {ctaText}
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/iglesia"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-900 shadow-sm transition-all duration-300 hover:scale-[1.02]"
            >
              <Users size={16} />
              Conócenos
            </Link>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 p-4 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <PlayCircle size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Comunidad VID en vivo y en comunidad
              </p>
              <p className="text-xs text-stone-300">
                Mira un vistazo real de nuestra iglesia
              </p>
            </div>
          </div>
        </div>

        <video
          src={churchMedia.introVideo}
          className="w-full bg-black"
          controls
          muted
          playsInline
          preload="metadata"
        />
      </div>
    </div>
  );
}