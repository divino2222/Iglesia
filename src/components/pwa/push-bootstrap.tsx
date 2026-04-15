"use client";

import { useEffect } from "react";

export default function PushBootstrap() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.log("✅ Service Worker registrado");
      })
      .catch((err) => {
        console.error("❌ Error SW:", err);
      });
  }, []);

  return null;
}