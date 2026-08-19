"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, PlayCircle, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Inicio", href: "/", icon: Home },
  { label: "En vivo", href: "/en-vivo", icon: Radio },
  { label: "Predicaciones", href: "/predicaciones", icon: PlayCircle },
  { label: "Eventos", href: "/eventos", icon: Calendar },
  { label: "Más", href: "/ministerios", icon: Users },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md border-t border-zinc-200 bg-white">
        <div className="flex justify-between px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center py-1 text-xs",
                  isActive ? "text-black" : "text-zinc-400"
                )}
              >
                <Icon size={20} />
                <span className="mt-1">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}