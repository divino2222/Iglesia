import HomeHero from "@/components/home/home-hero";
import QuickActions from "@/components/home/quick-actions";
import LiveUpcomingCard from "@/components/home/live-upcoming-card";
import SundayInviteBanner from "@/components/home/sunday-invite-banner";
import EventsSection from "@/components/home/events-section";
import SermonsSection from "@/components/home/sermons-section";
import ChurchInfoCard from "@/components/home/church-info-card";
import ChurchGalleryPreview from "@/components/home/church-gallery-preview";
import SectionHeading from "@/components/ui/section-heading";

export default function HomePage() {
  return (
    <div className="space-y-7 px-4 py-6">
      <HomeHero />

      <section>
        <SectionHeading
          eyebrow="Conecta"
          title="Transmisión y acceso rápido"
          subtitle="Acompáñanos en vivo o entra rápido a las secciones principales."
        />
        <div className="space-y-4">
          <LiveUpcomingCard />
          <QuickActions />
        </div>
      </section>

      <section>
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

      <section>
        <SectionHeading
          eyebrow="Galería"
          title="Nuestra comunidad"
          subtitle="Imágenes reales de la vida de la iglesia."
        />
        <ChurchGalleryPreview />
      </section>

      <section>
        <SectionHeading
          eyebrow="Agenda"
          title="Próximos eventos"
          subtitle="Mantente al día con reuniones regulares y actividades."
        />
        <EventsSection />
      </section>

      <section>
        <SectionHeading
          eyebrow="Escucha"
          title="Últimas predicaciones"
          subtitle="Mensajes recientes para fortalecer tu fe."
        />
        <SermonsSection />
      </section>
    </div>
  );
}