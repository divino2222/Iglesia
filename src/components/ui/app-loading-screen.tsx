"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Props = {
  title?: string;
  subtitle?: string;
};

function getRouteMessage(pathname: string) {
  if (pathname.startsWith("/en-vivo")) {
    return {
      title: "Comunidad VID",
      subtitle: "Preparando transmisión y acceso en vivo",
    };
  }

  if (pathname.startsWith("/eventos")) {
    return {
      title: "Comunidad VID",
      subtitle: "Cargando agenda y próximos eventos",
    };
  }

  if (pathname.startsWith("/predicaciones")) {
    return {
      title: "Comunidad VID",
      subtitle: "Cargando mensajes y predicaciones",
    };
  }

  if (pathname.startsWith("/iglesia")) {
    return {
      title: "Comunidad VID",
      subtitle: "Abriendo información de la iglesia",
    };
  }

  if (pathname.startsWith("/visita")) {
    return {
      title: "Comunidad VID",
      subtitle: "Preparando tu experiencia de visita",
    };
  }

  return {
    title: "Comunidad VID",
    subtitle: "Preparando tu experiencia",
  };
}

export default function AppLoadingScreen({
  title,
  subtitle,
}: Props) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const routeCopy = useMemo(() => getRouteMessage(pathname), [pathname]);

  const finalTitle = title ?? routeCopy.title;
  const finalSubtitle = subtitle ?? routeCopy.subtitle;

  return (
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f8f6f2_0%,#f2ede5_100%)] px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_30%)]" />
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/50 blur-3xl" />
      <div className="absolute bottom-[-120px] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-stone-200/40 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(0,0,0,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.6)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div
        className={`relative z-10 w-full max-w-sm transition-all duration-700 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-[40px] border border-white/70 bg-white/55 px-8 py-10 text-center shadow-[0_28px_70px_rgba(0,0,0,0.10)] backdrop-blur-2xl">
          <div
            className={`relative mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-[30px] border border-stone-200/80 bg-black shadow-[0_18px_36px_rgba(0,0,0,0.22)] transition-all duration-700 ease-out ${
              visible
                ? "scale-100 rotate-0 opacity-100"
                : "scale-90 rotate-[-6deg] opacity-0"
            }`}
            style={{
              animation: visible
                ? "cvFloat 3.2s ease-in-out infinite"
                : undefined,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.18) 35%, rgba(255,255,255,0.36) 50%, rgba(255,255,255,0.12) 65%, transparent 85%)",
                transform: "translateX(-140%)",
                animation: visible
                  ? "cvShimmer 2.6s ease-in-out infinite"
                  : undefined,
              }}
            />

            <Image
              src="/images/logo-comunidad-vid.png"
              alt="Logo Comunidad VID"
              width={96}
              height={96}
              className="relative z-10 h-auto w-auto max-h-full max-w-full object-contain"
              priority
            />
          </div>

          <div
            className={`mt-6 transition-all delay-100 duration-700 ease-out ${
              visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">
              Comunidad
            </p>

            <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-stone-950">
              {finalTitle}
            </h1>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              {finalSubtitle}
            </p>
          </div>

          <div
            className={`mt-7 flex items-center justify-center gap-2 transition-all delay-200 duration-700 ease-out ${
              visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-stone-900 [animation-delay:-0.2s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-stone-500 [animation-delay:-0.1s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-stone-300" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes cvFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes cvShimmer {
          0% {
            transform: translateX(-140%);
          }
          100% {
            transform: translateX(140%);
          }
        }
      `}</style>
    </div>
  );
}