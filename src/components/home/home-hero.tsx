import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { churchMedia } from "@/lib/church-media";

export default function HomeHero() {
  return (
    <section
      className="relative overflow-hidden rounded-[34px] border border-white/60 shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
      style={{
        backgroundImage: `url(${churchMedia.heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />

      <div className="relative z-10 p-5 text-white">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur">
          Comunidad VID
        </div>

        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
          Bienvenido a Comunidad VID
        </h1>

        <p className="mt-3 max-w-[90%] text-sm leading-6 text-white/85">
          Un lugar para crecer, creer y pertenecer.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/visita"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-900 shadow-sm transition hover:bg-stone-100"
          >
            Planifica tu visita
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/iglesia"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-900 shadow-sm transition hover:bg-stone-100"
          >
            <Users size={16} />
            Conócenos
          </Link>
        </div>
      </div>
    </section>
  );
}