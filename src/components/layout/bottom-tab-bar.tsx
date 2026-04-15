"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Radio,
  Bell,
  CalendarDays,
  Church,
} from "lucide-react";

const tabs = [
  {
    label: "Inicio",
    href: "/",
    icon: House,
    match: (pathname: string) => pathname === "/",
  },
  {
    label: "En vivo",
    href: "/en-vivo",
    icon: Radio,
    match: (pathname: string) => pathname.startsWith("/en-vivo"),
  },
  {
    label: "Mensajes",
    href: "/predicaciones",
    icon: Bell,
    match: (pathname: string) => pathname.startsWith("/predicaciones"),
  },
  {
    label: "Eventos",
    href: "/eventos",
    icon: CalendarDays,
    match: (pathname: string) => pathname.startsWith("/eventos"),
  },
  {
    label: "Conócenos",
    href: "/iglesia",
    icon: Church,
    match: (pathname: string) =>
      pathname.startsWith("/iglesia") ||
      pathname.startsWith("/visita") ||
      pathname.startsWith("/contacto") ||
      pathname.startsWith("/donar") ||
      pathname.startsWith("/oracion") ||
      pathname.startsWith("/ministerios"),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto w-full max-w-md px-3 pb-3">
        <div className="rounded-t-[26px] rounded-b-[22px] border border-stone-200/80 bg-stone-50/95 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="flex h-[78px] items-center justify-around px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.match(pathname);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`group relative flex min-w-[62px] flex-col items-center justify-center rounded-[20px] px-3 py-2 transition-all duration-300 active:scale-95 ${
                    isActive
                      ? "bg-white shadow-sm ring-1 ring-stone-200"
                      : "text-stone-500 hover:bg-white/70 hover:text-stone-700"
                  }`}
                >
                  <div
                    className={`mb-1 flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-300 ${
                      isActive
                        ? "bg-stone-900 text-white shadow-sm"
                        : "bg-transparent text-stone-500 group-hover:text-stone-700"
                    }`}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </div>

                  <span
                    className={`text-[11px] font-medium transition-all duration-300 ${
                      isActive ? "text-stone-900" : "text-stone-500"
                    }`}
                  >
                    {tab.label}
                  </span>

                  {isActive ? (
                    <span className="absolute -top-1 h-1.5 w-8 rounded-full bg-stone-900/90" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}