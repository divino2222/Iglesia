import Link from "next/link";
import { HandHeart } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  Camera,
  HeartHandshake,
  MessageCircle,
  MessageCircleHeart,
  Mic2,
  Radio,
} from "lucide-react";

const quickActions = [
  {
    label: "En vivo",
    description: "Transmisiones y reuniones en línea.",
    href: "/en-vivo",
    icon: Radio,
    className: "bg-red-50 text-red-600 border-red-100",
  },
  {
    label: "Eventos",
    description: "Próximas reuniones y actividades.",
    href: "/eventos",
    icon: CalendarDays,
    className: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    label: "Galería",
    description: "Fotos y videos de Comunidad VID.",
    href: "/galeria",
    icon: Camera,
    className: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
  },
  {
    label: "Biblia en línea",
    description: "Lee la Palabra desde la app.",
    href: "/biblia",
    icon: BookOpen,
    className: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    label: "Oración",
    description: "Envía tu petición o únete a orar.",
    href: "/oracion",
    icon: MessageCircleHeart,
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    label: "Predicaciones",
    description: "Mensajes recientes para fortalecer tu fe.",
    href: "/predicaciones",
    icon: Mic2,
    className: "bg-stone-50 text-stone-700 border-stone-100",
  },
  {
    label: "WhatsApp",
    description: "Contáctanos rápidamente.",
    href: "https://wa.me/525520035631",
    icon: MessageCircle,
    className: "bg-green-50 text-green-700 border-green-100",
    external: true,
  },
  {
  label: "Servir",
  description: "Plan de servidores del domingo.",
  href: "/servir",
  icon: HandHeart,
  className: "bg-orange-50 text-orange-700 border-orange-100",
  },
];

export default function QuickActions() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
          Accesos rápidos
        </p>
        <h3 className="mt-1 text-xl font-semibold text-stone-950">
          Todo lo principal de Comunidad VID
        </h3>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Entra rápido a la Biblia en línea, galería, transmisiones, eventos,
          predicaciones y oración.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
              className={`rounded-[24px] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.className}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80">
                <Icon size={21} />
              </div>

              <p className="mt-3 text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs leading-5 opacity-80">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>

      <Link
        href="/donar"
        className="flex items-center justify-center gap-2 rounded-[24px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100"
      >
        <HeartHandshake size={18} />
        Apoyar a Comunidad VID
      </Link>
    </div>
  );
}