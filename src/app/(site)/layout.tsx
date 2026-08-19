import Header from "@/components/layout/header";
import BottomTabBar from "@/components/layout/bottom-tab-bar";
import PageContainer from "@/components/layout/page-container";
import AppShell from "@/components/layout/app-shell";
import PageTransition from "@/components/layout/page-transition";

import SiteOnboardingGate from "@/components/onboarding/site-onboarding-gate";
import PushBootstrap from "@/components/pwa/push-bootstrap";
import AppUpdatePrompt from "@/components/pwa/app-update-prompt";

import { getChurchInfo } from "@/lib/church-info";
import { getAppAnnouncements } from "@/lib/announcements";
import { getCurrentAccess } from "@/lib/auth/permissions";
import { hasUpcomingAssignment } from "@/lib/user-service-access";

type AccessLink = {
  href: string;
  label: string;
};

function buildAccessLinks(
  access: Awaited<
    ReturnType<typeof getCurrentAccess>
  >,
  hasService: boolean
): AccessLink[] {
  if (!access) {
    return [];
  }

  const links: AccessLink[] = [];

  if (access.roleName === "admin") {
  links.push({
    href: "/admin",
    label: "Panel de Administración",
  });
}

  if (access.roleName === "pastor") {
    links.push({
      href: "/pastor",
      label: "Centro Pastoral",
    });
  }

  if (
    access.roleName ===
      "coordinator" ||
    access.roleName === "admin"
  ) {
    links.push({
      href: "/coordinacion",
      label: "Centro de Coordinación",
    });
  }

  if (
    access.roleName ===
    "ministry_leader"
  ) {
    links.push({
      href: "/mi-ministerio",
      label: "Mi Ministerio",
    });
  }

  if (hasService) {
    links.push({
      href: "/mi-servicio",
      label: "Mi Servicio",
    });
  }

  links.push({
    href: "/perfil",
    label: "Mi Perfil",
  });

  return Array.from(
    new Map(
      links.map((link) => [
        link.href,
        link,
      ])
    ).values()
  );
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    churchInfo,
    announcements,
    access,
  ] = await Promise.all([
    getChurchInfo(),
    getAppAnnouncements(),
    getCurrentAccess(),
  ]);

  const hasService =
    access?.profileId
      ? await hasUpcomingAssignment(
          access.profileId
        )
      : false;

  const accessLinks =
    buildAccessLinks(
      access,
      hasService
    );

  return (
    <AppShell>
      <PageContainer>
        <PushBootstrap />

        <SiteOnboardingGate />

        <AppUpdatePrompt />

        <Header
          churchName={
            churchInfo?.church_name ??
            "Comunidad VID"
          }
          announcements={
            announcements
          }
          userName={
            access?.fullName ?? null
          }
          roleLabel={
            access?.roleLabel ?? null
          }
          accessLinks={
            accessLinks
          }
        />

        <main className="pb-28">
          <PageTransition>
            {children}
          </PageTransition>
        </main>

        <BottomTabBar />
      </PageContainer>
    </AppShell>
  );
}