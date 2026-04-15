"use client";

import Image from "next/image";

type Props = {
  isClosing?: boolean;
};

export default function SplashScreen({ isClosing = false }: Props) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-700 ${
        isClosing
          ? "pointer-events-none scale-105 opacity-0"
          : "scale-100 opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-900" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_35%)]" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="relative h-44 w-44 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
          <Image
            src="/images/logo-comunidad-vid.png"
            alt="Comunidad VID"
            fill
            className="object-contain p-3"
            priority
          />
        </div>

        <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-zinc-400">
          Iglesia
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-white">
          Comunidad VID
        </h1>

        <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-300">
          Un lugar para crecer, creer y pertenecer
        </p>

        <div className="mt-8 h-1 w-24 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full origin-left animate-[loadingBar_1.6s_ease-in-out] rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
}