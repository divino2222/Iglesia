"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  House,
  Radio,
  PlayCircle,
  CalendarDays,
  Users,
  MapPinned,
  HandCoins,
  Mail,
  HeartHandshake,
  MessageCircle,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  churchName?: string;
};

const internalItems = [
  { label: "Inicio", href: "/", icon: House },
  { label: "En vivo", href: "/en-vivo", icon: Radio },
  { label: "Predicaciones", href: "/predicaciones", icon: PlayCircle },
  { label: "Eventos", href: "/eventos", icon: CalendarDays },
  { label: "Conócenos", href: "/iglesia", icon: Users },
  { label: "Planifica tu visita", href: "/visita", icon: MapPinned },
  { label: "Donar", href: "/donar", icon: HandCoins },
  { label: "Contacto", href: "/contacto", icon: Mail },
  { label: "Peticiones de oración", href: "/oracion", icon: HeartHandshake },
];

const whatsappNumber = "525520035631";

const externalItems = [
  {
    label: "WhatsApp",
    href: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      "Hola, me gustaría recibir información de Comunidad VID."
    )}`,
    icon: MessageCircle,
  },
];

export default function MobileMenuDrawer({
  open,
  onClose,
  churchName = "Comunidad VID",
}: Props) {
  const pathname = usePathname();

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px] transition ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed top-0 left-0 z-[70] h-full w-[86%] max-w-sm bg-stone-50 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-stone-200 px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-black shadow-sm">
                  <Image
                    src="/images/logo-comunidad-vid.png"
                    alt="Logo Comunidad VID"
                    width={48}
                    height={48}
                    className="h-auto w-auto max-h-full max-w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-base font-semibold text-stone-900">
                    {churchName}
                  </p>
                  <p className="text-xs text-stone-500">Menú principal</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-stone-600 transition hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Comunidad
              </p>
              <p className="mt-1 text-sm text-stone-700">
                Un lugar para crecer, creer y pertenecer
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Navegación
            </p>

            <nav className="space-y-2">
              {internalItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`group flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-stone-900 text-white shadow-sm"
                        : "bg-white text-stone-700 ring-1 ring-stone-200 hover:-translate-y-0.5 hover:bg-stone-100"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                        active ? "bg-white/10" : "bg-stone-100"
                      }`}
                    >
                      <Icon size={17} />
                    </div>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <p className="mb-3 mt-6 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Accesos directos
            </p>

            <div className="space-y-2">
              {externalItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onClose}
                    className="group flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:bg-stone-100"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Icon size={17} />
                    </div>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-stone-200 px-5 py-4">
            <p className="text-xs text-stone-400">
              Comunidad VID · App móvil
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}