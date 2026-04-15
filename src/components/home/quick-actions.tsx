import Link from "next/link";
import {
  Radio,
  CalendarDays,
  MessageCircle,
  HeartHandshake,
} from "lucide-react";
import { getChurchInfo } from "@/lib/church-info";

const actions = [
  {
    label: "En vivo",
    href: "/en-vivo",
    icon: Radio,
    accent: "bg-red-50 text-red-700 border-red-100",
    iconAccent: "bg-red-100 text-red-700",
  },
  {
    label: "Eventos",
    href: "/eventos",
    icon: CalendarDays,
    accent: "bg-blue-50 text-blue-700 border-blue-100",
    iconAccent: "bg-blue-100 text-blue-700",
  },
  {
    label: "WhatsApp",
    href: "#",
    icon: MessageCircle,
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconAccent: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Oración",
    href: "/oracion",
    icon: HeartHandshake,
    accent: "bg-amber-50 text-amber-700 border-amber-100",
    iconAccent: "bg-amber-100 text-amber-700",
  },
];

export default async function QuickActions() {
  const churchInfo = await getChurchInfo();
  const whatsappNumber = churchInfo?.whatsapp_number?.trim() || "525520035631";
  const churchName = churchInfo?.church_name ?? "Comunidad VID";

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        const href =
          action.label === "WhatsApp"
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                `Hola, me gustaría recibir información de ${churchName}.`
              )}`
            : action.href;

        const external = action.label === "WhatsApp";

        return (
          <Link
            key={action.label}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className={`group flex flex-col items-center justify-center rounded-[24px] border p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${action.accent}`}
          >
            <div
              className={`mb-2 flex h-11 w-11 items-center justify-center rounded-2xl ${action.iconAccent}`}
            >
              <Icon size={18} />
            </div>
            <span className="text-[12px] font-medium">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}