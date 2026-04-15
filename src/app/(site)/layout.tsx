import Header from "@/components/layout/header";
import BottomTabBar from "@/components/layout/bottom-tab-bar";
import PageContainer from "@/components/layout/page-container";
import AppShell from "@/components/layout/app-shell";
import PageTransition from "@/components/layout/page-transition";
import { getChurchInfo } from "@/lib/church-info";
import { getAppAnnouncements } from "@/lib/announcements";
import SiteOnboardingGate from "@/components/onboarding/site-onboarding-gate";
import PushBootstrap from "@/components/pwa/push-bootstrap";
import AppUpdatePrompt from "@/components/pwa/app-update-prompt";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const churchInfo = await getChurchInfo();
  const announcements = await getAppAnnouncements();

  return (
    <AppShell>
      <PageContainer>
        <PushBootstrap />
        <SiteOnboardingGate />
        <AppUpdatePrompt />
        <Header
          churchName={churchInfo?.church_name ?? "Comunidad VID"}
          announcements={announcements}
        />
        <main className="pb-28">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomTabBar />
      </PageContainer>
    </AppShell>
  );
}