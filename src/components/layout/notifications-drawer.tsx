"use client";

import Link from "next/link";
import { Bell, Megaphone, HeartHandshake, Radio, CalendarDays, X } from "lucide-react";
import type { AppAnnouncement } from "@/lib/announcements";

type Props = {
  open: boolean;
  onClose: () => void;
  items?: AppAnnouncement[];
};

function getAnnouncementStyle(type: AppAnnouncement["type"]) {
  switch (type) {
    case "oracion":
      return {
        icon: HeartHandshake,
        iconWrap: "bg-emerald-100 text-emerald-700",
        pill: "bg-emerald-100 text-emerald-700",
        label: "Oración",
      };
    case "en-vivo":
      return {
        icon: Radio,
        iconWrap: "bg-red-100 text-red-700",
        pill: "bg-red-100 text-red-700",
        label: "En vivo",
      };
    case "evento":
      return {
        icon: CalendarDays,
        iconWrap: "bg-amber-100 text-amber-700",
        pill: "bg-amber-100 text-amber-700",
        label: "Próximo",
      };
    default:
      return {
        icon: Megaphone,
        iconWrap: "bg-stone-100 text-stone-700",
        pill: "bg-stone-100 text-stone-700",
        label: "Aviso",
      };
  }
}

export default function NotificationsDrawer({
  open,
  onClose,
  items = [],
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
        className={`fixed right-0 top-0 z-[80] h-full w-[88%] max-w-sm bg-[#f8f6f2] shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-stone-200 px-4 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight text-stone-950">
                    Avisos
                  </p>
                  <p className="text-sm text-stone-500">
                    Novedades y recordatorios
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl p-2 text-stone-600 transition hover:bg-white active:scale-95"
                aria-label="Cerrar avisos"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            {items.length === 0 ? (
              <div className="rounded-[24px] border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
                Por ahora no hay avisos nuevos.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const style = getAnnouncementStyle(item.type);
                  const Icon = style.icon;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onClose}
                      className="block rounded-[26px] border border-stone-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.iconWrap}`}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.pill}`}
                            >
                              {style.label}
                            </span>

                            {item.isPriority ? (
                              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                Próximo
                              </span>
                            ) : null}
                          </div>

                          <h3 className="text-base font-semibold leading-6 text-stone-900">
                            {item.title}
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-stone-600">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-stone-200 px-4 py-4">
            <p className="text-xs text-stone-400">
              Comunidad VID · Centro de avisos
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}