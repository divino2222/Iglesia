"use client";

import { useState } from "react";
import { Smartphone, Video, Calendar, ArrowRight } from "lucide-react";

const slides = [
  {
    icon: Video,
    title: "Conéctate en vivo",
    text: "Accede fácilmente a nuestras transmisiones y no te pierdas ningún mensaje.",
  },
  {
    icon: Calendar,
    title: "Mantente al día",
    text: "Consulta eventos, reuniones y actividades de la iglesia en todo momento.",
  },
  {
    icon: Smartphone,
    title: "Instala la app",
    text: "Disfruta una experiencia más rápida y sin distracciones desde tu celular.",
  },
];

export default function OnboardingScreen({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);

  const next = () => {
    if (index < slides.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      localStorage.setItem("onboarding_seen", "true");
      onFinish();
    }
  };

  const skip = () => {
    localStorage.setItem("onboarding_seen", "true");
    onFinish();
  };

  const SlideIcon = slides[index].icon;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-between bg-gradient-to-br from-black via-neutral-950 to-neutral-900 px-6 py-10 text-white">
      <div className="flex justify-end">
        <button
          onClick={skip}
          className="text-sm text-white/60 transition hover:text-white active:scale-95"
        >
          Omitir
        </button>
      </div>

      <div
        key={index}
        className="flex flex-col items-center gap-6 text-center transition-all duration-300"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 shadow-xl ring-1 ring-white/10 backdrop-blur">
          <SlideIcon size={36} />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight">
          {slides[index].title}
        </h2>

        <p className="max-w-xs text-sm leading-relaxed text-white/70">
          {slides[index].text}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-black shadow-xl transition active:scale-95"
        >
          {index === slides.length - 1 ? "Comenzar" : "Siguiente"}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}