"use client";

import Image from "next/image";
import { Bell, Menu } from "lucide-react";
import { useState } from "react";
import MobileMenuDrawer from "@/components/layout/mobile-menu-drawer";
import NotificationsDrawer from "@/components/layout/notifications-drawer";
import type { AppAnnouncement } from "@/lib/announcements";

type Props = {
  churchName?: string;
  announcements?: AppAnnouncement[];
};

export default function Header({
  churchName = "Comunidad VID",
  announcements = [],
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const count = announcements.length;
  const hasNotifications = count > 0;
  const displayCount = count > 9 ? "9+" : String(count);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#f8f6f2]/85 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-black shadow-[0_8px_20px_rgba(0,0,0,0.10)]">
              <Image
                src="/images/logo-comunidad-vid.png"
                alt="Logo Comunidad VID"
                width={44}
                height={44}
                className="h-auto w-auto max-h-full max-w-full object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-stone-950">
                {churchName}
              </p>
              <p className="truncate text-xs text-stone-500">
                Bienvenido
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative rounded-2xl p-2.5 text-stone-600 transition hover:bg-white/80 active:scale-95"
              aria-label="Notificaciones"
            >
              <Bell size={18} />
              {hasNotifications ? (
                <>
                  <span className="absolute right-0 top-0 min-w-[18px] rounded-full bg-red-500 px-1.5 py-[1px] text-center text-[10px] font-semibold leading-4 text-white shadow-sm">
                    {displayCount}
                  </span>
                  <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                </>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-2xl p-2.5 text-stone-700 transition hover:bg-white/80 active:scale-95"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        churchName={churchName}
      />

      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        items={announcements}
      />
    </>
  );
}