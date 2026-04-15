"use client";

import Link from "next/link";
import {
  X,
  House,
  Radio,
  PlayCircle,
  CalendarDays,
  Users,
  MapPinned,
  HandCoins,
  MessageCircle,
  HeartHandshake,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  churchName?: string;
};

const items = [
  { label: "Inicio", href: "/", icon: House },
  { label: "En vivo", href: "/en-vivo", icon: Radio },
  { label: "Predicaciones", href: "/predicaciones", icon: PlayCircle },
  { label: "Eventos", href: "/eventos", icon: CalendarDays },
  { label: "Conócenos", href: "/iglesia", icon: Users },
  { label: "Planifica tu visita", href: "/visita", icon: MapPinned },
  { label: "Donar", href: "/donar", icon: HandCoins },
  { label: "Contacto", href: "/contacto", icon: MessageCircle },
  { label: "Peticiones de oración", href: "/oracion", icon: HeartHandshake },
];

export default function MobileMenuDrawer({
  open,
  onClose,
  churchName = "Comunidad VID",
}: Props) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[70] bg-black/35 backdrop-blur-[2px] transition ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-[80] h-full w-[86%] max-w-sm bg-[#f8f6f2] shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-stone-200 px-4 py-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold tracking-tight text-stone-950">
                  {churchName}
                </p>
                <p className="text-sm text-stone-500">Menú principal</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl p-2 text-stone-600 transition hover:bg-white active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-[24px] border border-stone-200 bg-white/70 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                Comunidad
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                Un lugar para crecer, creer y pertenecer
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-2">
              {items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-[22px] border border-stone-200 bg-white px-4 py-4 text-stone-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                      <Icon size={18} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-stone-200 px-4 py-4">
            <p className="text-xs text-stone-400">{churchName} · App móvil</p>
          </div>
        </div>
      </aside>
    </>
  );
}