"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type MinistryRequestAutoRefreshProps = {
  enabled: boolean;
};

export default function MinistryRequestAutoRefresh({
  enabled,
}: MinistryRequestAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, router]);

  return null;
}