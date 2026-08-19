import GalleryGrid from "@/components/gallery/gallery-grid";
import VideoGallery from "@/components/gallery/video-gallery";

export default function GaleriaPage() {
  return (
    <div className="space-y-6 px-4 py-6">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
          Galería
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          Fotos y videos
        </h1>

        <p className="text-sm leading-6 text-stone-600">
          Revive momentos especiales de Comunidad VID: servicios, reuniones,
          bautizos y vida de iglesia.
        </p>
      </section>

      <GalleryGrid />

      <VideoGallery />
    </div>
  );
}