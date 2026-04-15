"use client";

import {
  X,
  Bell,
  Radio,
  CalendarDays,
  HeartHandshake,
  Megaphone,
  Sparkles,
} from "lucide-react";
import type { AppAnnouncement } from "@/lib/announcements";

type Props = {
  open: boolean;
  onClose: () => void;
  items: AppAnnouncement[];
};

function getAnnouncementStyle(type: AppAnnouncement["type"]) {
  switch (type) {
    case "en-vivo":
      return {
        icon: Radio,
        color: "bg-red-100 text-red-700",
        badge: "bg-red-100 text-red-700",
        label: "En vivo",
      };
    case "evento":
      return {
        icon: CalendarDays,
        color: "bg-blue-100 text-blue-700",
        badge: "bg-blue-100 text-blue-700",
        label: "Evento",
      };
    case "oracion":
      return {
        icon: HeartHandshake,
        color: "bg-emerald-100 text-emerald-700",
        badge: "bg-emerald-100 text-emerald-700",
        label: "Oración",
      };
    default:
      return {
        icon: Megaphone,
        color: "bg-stone-100 text-stone-700",
        badge: "bg-stone-100 text-stone-700",
        label: "Aviso",
      };
  }
}

export default function NotificationsDrawer({ open, onClose, items }: Props) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[80] bg-black/30 backdrop-blur-[1px] transition ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed top-0 right-0 z-[90] h-full w-[88%] max-w-sm bg-stone-50 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-stone-200 px-5 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm">
                  <Bell size={18} />
                </div>

                <div>
                  <p className="text-base font-semibold text-stone-900">Avisos</p>
                  <p className="text-xs text-stone-500">
                    Novedades y recordatorios
                  </p>
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
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {items.length === 0 ? (
              <div className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-stone-600">
                  Por ahora no hay avisos disponibles.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const style = getAnnouncementStyle(item.type);
                  const Icon = style.icon;

                  return (
                    <div
                      key={item.id}
                      className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.color}`}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.badge}`}
                            >
                              {style.label}
                            </span>

                            {item.isPriority ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                <Sparkles size={11} />
                                Próximo
                              </span>
                            ) : null}
                          </div>

                          <p className="text-sm font-semibold text-stone-900">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-stone-600">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-stone-200 px-5 py-4">
            <p className="text-xs text-stone-400">
              Comunidad VID · Centro de avisos
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}