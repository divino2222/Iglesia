import Link from "next/link";
import {
  ChevronRight,
  HeartHandshake,
  MapPin,
  HandCoins,
  Mail,
  Users,
} from "lucide-react";
import { getChurchInfo } from "@/lib/church-info";

const items = [
  {
    title: "Ministerios",
    description: "Conoce las áreas y grupos de la iglesia",
    href: "/ministerios",
    icon: Users,
  },
  {
    title: "Planifica tu visita",
    description: "Horarios, ubicación y qué esperar",
    href: "/visita",
    icon: MapPin,
  },
  {
    title: "Donar",
    description: "Apoya la misión y el trabajo de la iglesia",
    href: "/donar",
    icon: HandCoins,
  },
  {
    title: "Contacto",
    description: "Envíanos un mensaje",
    href: "/contacto",
    icon: Mail,
  },
  {
    title: "Peticiones de oración",
    description: "Comparte tu petición con nosotros",
    href: "/oracion",
    icon: HeartHandshake,
  },
];

export default async function MorePage() {
  const churchInfo = await getChurchInfo();

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Más</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Accede a más secciones y recursos de{" "}
          {churchInfo?.church_name ?? "Comunidad VID"}.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100">
                  <Icon size={20} className="text-zinc-700" />
                </div>

                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{item.title}</p>
                  <p className="truncate text-sm text-zinc-500">
                    {item.description}
                  </p>
                </div>
              </div>

              <ChevronRight size={18} className="text-zinc-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}