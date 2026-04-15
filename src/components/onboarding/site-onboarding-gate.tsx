"use client";

import { useEffect, useState } from "react";
import OnboardingScreen from "@/components/onboarding/onboarding-screen";

const STORAGE_KEY = "onboarding_seen";

export default function SiteOnboardingGate() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    setShowOnboarding(!seen);
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!showOnboarding) return null;

  return (
    <OnboardingScreen
      onFinish={() => {
        window.localStorage.setItem(STORAGE_KEY, "true");
        setShowOnboarding(false);
      }}
    />
  );
}