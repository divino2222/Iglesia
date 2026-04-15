"use client";

import { useEffect, useState } from "react";
import SplashScreen from "@/components/layout/splash-screen";

type Props = {
  children: React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const [showSplash, setShowSplash] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("vid-splash-seen");

    if (!alreadySeen) {
      setShowSplash(true);

      const closeTimer = setTimeout(() => {
        setIsClosing(true);
      }, 1500);

      const endTimer = setTimeout(() => {
        setShowSplash(false);
        setIsReady(true);
        sessionStorage.setItem("vid-splash-seen", "true");
      }, 2200);

      return () => {
        clearTimeout(closeTimer);
        clearTimeout(endTimer);
      };
    }

    setIsReady(true);
  }, []);

  return (
    <>
      {showSplash ? <SplashScreen isClosing={isClosing} /> : null}

      <div
        className={`transition-opacity duration-500 ${
          isReady ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {children}
      </div>
    </>
  );
}