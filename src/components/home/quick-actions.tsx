import Link from "next/link";
import {
  Radio,
  CalendarDays,
  MessageCircle,
  HeartHandshake,
} from "lucide-react";
import { getChurchInfo } from "@/lib/church-info";

export default async function QuickActions() {
  const churchInfo = await getChurchInfo();
  const churchName = churchInfo?.church_name ?? "Comunidad VID";
  const whatsappNumber = churchInfo?.whatsapp_number?.trim() || "525520035631";

  const whatsappGeneralMessage = encodeURIComponent(
    `Hola, me gustaría recibir información de ${churchName}.`
  );

  const actions = [
    {
      title: "En vivo",
      href: "/en-vivo",
      icon: Radio,
      color: "bg-gradient-to-br from-red-50 to-red-100 text-red-700",
      ring: "ring-red-100",
      external: false,
    },
    {
      title: "Eventos",
      href: "/eventos",
      icon: CalendarDays,
      color: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700",
      ring: "ring-blue-100",
      external: false,
    },
    {
      title: "WhatsApp",
      href: `https://wa.me/${whatsappNumber}?text=${whatsappGeneralMessage}`,
      icon: MessageCircle,
      color: "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700",
      ring: "ring-emerald-100",
      external: true,
    },
    {
      title: "Oración",
      href: "/oracion",
      icon: HeartHandshake,
      color: "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700",
      ring: "ring-amber-100",
      external: false,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.title}
            href={action.href}
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noreferrer" : undefined}
            className={`group flex flex-col items-center justify-center rounded-[22px] border border-stone-200 bg-white px-3 py-4 shadow-sm ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-lg ${action.ring}`}
          >
            <div
              className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition duration-300 group-hover:scale-105 ${action.color}`}
            >
              <Icon size={18} />
            </div>
            <span className="text-center text-[11px] font-medium text-stone-700">
              {action.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}