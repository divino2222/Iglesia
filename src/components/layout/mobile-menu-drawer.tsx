"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Camera,
  Church,
  Contact,
  Crown,
  Gauge,
  HandHeart,
  HeartHandshake,
  Home,
  MapPin,
  MessageCircleHeart,
  Mic2,
  Radio,
  ShieldCheck,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";

type AccessLink = {
  href: string;
  label: string;
  icon?: React.ElementType;
};

type Props = {
  open: boolean;
  onClose: () => void;
  accessLinks?: AccessLink[];
  userName?: string | null;
  roleLabel?: string | null;
};

const mainLinks = [
  {
    href: "/",
    label: "Inicio",
    icon: Home,
  },
  {
    href: "/en-vivo",
    label: "En vivo",
    icon: Radio,
  },
  {
    href: "/eventos",
    label: "Eventos",
    icon: CalendarDays,
  },
  {
    href: "/galeria",
    label: "Galería",
    icon: Camera,
  },
  {
    href: "/biblia",
    label: "Biblia en línea",
    icon: BookOpen,
  },
  {
    href: "/predicaciones",
    label: "Predicaciones",
    icon: Mic2,
  },
  {
    href: "/servir",
    label: "Servir",
    icon: HandHeart,
  },
];

const communityLinks = [
  {
    href: "/conocenos",
    label: "Conócenos",
    icon: Church,
  },
  {
    href: "/visita",
    label: "Planifica tu visita",
    icon: MapPin,
  },
  {
    href: "/oracion",
    label: "Peticiones de oración",
    icon: MessageCircleHeart,
  },
  {
    href: "/contacto",
    label: "Contacto",
    icon: Contact,
  },
];

const supportLinks = [
  {
    href: "/donar",
    label: "Donar",
    icon: HeartHandshake,
  },
];

function getDefaultAccessIcon(
  href: string
): React.ElementType {
  if (href === "/admin") {
    return ShieldCheck;
  }

  if (href === "/pastor") {
    return Crown;
  }

  if (href === "/coordinacion") {
    return Gauge;
  }

  if (href === "/mi-ministerio") {
    return UsersRound;
  }

  if (href === "/mi-servicio") {
    return UserCog;
  }

  return ShieldCheck;
}

function MenuGroup({
  title,
  links,
  onClose,
}: {
  title: string;
  links: {
    href: string;
    label: string;
    icon: React.ElementType;
  }[];
  onClose: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
        {title}
      </p>

      <div className="space-y-2">
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-[22px] border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                <Icon size={17} />
              </span>

              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function MobileMenuDrawer({
  open,
  onClose,
  accessLinks = [],
  userName,
  roleLabel,
}: Props) {
  if (!open) {
    return null;
  }

  const normalizedAccessLinks =
    accessLinks.map((item) => ({
      ...item,
      icon:
        item.icon ??
        getDefaultAccessIcon(item.href),
    }));

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      />

      <aside className="absolute left-0 top-0 flex h-full w-[84%] max-w-[340px] flex-col bg-[#f7f5f0] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">
              Comunidad VID
            </h2>

            <p className="mt-1 text-xs text-stone-500">
              Menú principal
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {(userName || roleLabel) && (
            <div className="rounded-[24px] bg-stone-950 p-4 text-white shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Tu cuenta
              </p>

              {userName ? (
                <h3 className="mt-2 text-base font-semibold">
                  {userName}
                </h3>
              ) : null}

              {roleLabel ? (
                <p className="mt-1 text-xs text-white/60">
                  {roleLabel}
                </p>
              ) : null}
            </div>
          )}

          {normalizedAccessLinks.length > 0 ? (
            <MenuGroup
              title="Tu espacio"
              links={normalizedAccessLinks}
              onClose={onClose}
            />
          ) : null}

          <div className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              Comunidad VID
            </p>

            <h3 className="mt-2 text-base font-semibold text-stone-950">
              Todo en un solo lugar
            </h3>

            <p className="mt-2 text-xs leading-5 text-stone-600">
              En vivo, Biblia en línea, galería, predicaciones, eventos y
              oración para caminar juntos como comunidad.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-red-50 px-3 py-2 text-red-600">
                En vivo
              </span>

              <span className="rounded-full bg-violet-50 px-3 py-2 text-violet-700">
                Biblia
              </span>

              <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-700">
                Galería
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
                Oración
              </span>
            </div>
          </div>

          <MenuGroup
            title="Principal"
            links={mainLinks}
            onClose={onClose}
          />

          <MenuGroup
            title="Comunidad"
            links={communityLinks}
            onClose={onClose}
          />

          <MenuGroup
            title="Apoya"
            links={supportLinks}
            onClose={onClose}
          />
        </div>

        <div className="border-t border-stone-200 px-5 py-4">
          <p className="text-xs text-stone-500">
            Comunidad VID · App móvil
          </p>
        </div>
      </aside>
    </div>
  );
}