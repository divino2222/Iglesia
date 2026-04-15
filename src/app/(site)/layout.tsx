import Header from "@/components/layout/header";
import BottomTabBar from "@/components/layout/bottom-tab-bar";
import PageContainer from "@/components/layout/page-container";
import AppShell from "@/components/layout/app-shell";
import { getChurchInfo } from "@/lib/church-info";
import { getAppAnnouncements } from "@/lib/announcements";

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
        <Header
          churchName={churchInfo?.church_name ?? "Comunidad VID"}
          announcements={announcements}
        />
        <main className="pb-28">{children}</main>
        <BottomTabBar />
      </PageContainer>
    </AppShell>
  );
}