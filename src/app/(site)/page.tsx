import HomeHero from "@/components/home/home-hero";
import QuickActions from "@/components/home/quick-actions";
import LiveUpcomingCard from "@/components/home/live-upcoming-card";
import SundayInviteBanner from "@/components/home/sunday-invite-banner";
import EventsSection from "@/components/home/events-section";
import SermonsSection from "@/components/home/sermons-section";
import ChurchInfoCard from "@/components/home/church-info-card";
import ChurchGalleryPreview from "@/components/home/church-gallery-preview";
import PrayerLeaderCard from "@/components/home/prayer-leader-card";
import SectionHeading from "@/components/ui/section-heading";
import HomeOnboarding from "@/components/onboarding/home-onboarding";
import InstallAppPrompt from "@/components/pwa/install-app-prompt";
import PushNotificationsPrompt from "@/components/pwa/push-notifications-prompt";
import FloatingInstallButton from "@/components/pwa/floating-install-button";

export default function HomePage() {
  return (
    <>
      <HomeOnboarding />
      <InstallAppPrompt />
      <PushNotificationsPrompt />
      <FloatingInstallButton />

      <div className="space-y-8 px-4 py-6">
        <HomeHero />

        <section className="rounded-[34px] border border-white/60 bg-white/70 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-sm">
          <SectionHeading
            eyebrow="Conecta"
            title="Transmisión y acceso rápido"
            subtitle="Acompáñanos en vivo o entra rápido a las secciones principales."
          />
          <div className="space-y-4">
            <LiveUpcomingCard />
            <QuickActions />
            <PrayerLeaderCard />
          </div>
        </section>

        <section className="rounded-[34px] border border-white/60 bg-white/70 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-sm">
          <SectionHeading
            eyebrow="Te esperamos"
            title="Reúnete con nosotros"
            subtitle="Encuentra el próximo servicio presencial y cómo llegar."
          />
          <div className="space-y-4">
            <SundayInviteBanner />
            <ChurchInfoCard />
          </div>
        </section>

        <section className="rounded-[34px] border border-white/60 bg-white/70 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-sm">
          <SectionHeading
            eyebrow="Galería"
            title="Nuestra comunidad"
            subtitle="Imágenes reales de la vida de la iglesia."
          />
          <ChurchGalleryPreview />
        </section>

        <section className="rounded-[34px] border border-white/60 bg-white/70 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-sm">
          <SectionHeading
            eyebrow="Agenda"
            title="Próximos eventos"
            subtitle="Primero verás el evento más cercano y después los especiales de la comunidad."
          />
          <EventsSection />
        </section>

        <section className="rounded-[34px] border border-white/60 bg-white/70 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.06)] backdrop-blur-sm">
          <SectionHeading
            eyebrow="Escucha"
            title="Últimas predicaciones"
            subtitle="Mensajes recientes para fortalecer tu fe."
          />
          <SermonsSection />
        </section>
      </div>
    </>
  );
}