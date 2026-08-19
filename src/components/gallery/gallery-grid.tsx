import { Camera, Images } from "lucide-react";
import { churchMedia } from "@/lib/church-media";
import PhotoViewer from "@/components/gallery/photo-viewer";

export default function GalleryGrid() {
  const images = churchMedia.images;
  const albums = Array.from(new Set(images.map((image) => image.album)));

  return (
    <section className="space-y-5">
      <div className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">
          <Images size={13} />
          Álbumes
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
          Momentos de Comunidad VID
        </h2>

        <p className="mt-2 text-sm leading-6 text-stone-600">
          Fotos de nuestras reuniones, eventos y vida de comunidad.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {albums.map((album) => {
            const cover = images.find((image) => image.album === album);

            return (
              <div
                key={album}
                className="overflow-hidden rounded-[24px] border border-stone-100 bg-stone-50"
              >
                <div
                  className="h-28"
                  style={{
                    backgroundImage: `url(${cover?.src || churchMedia.heroImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                <div className="p-3">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-white text-violet-700">
                    <Camera size={16} />
                  </div>

                  <p className="text-sm font-semibold text-stone-950">
                    {album}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {
                      images.filter((image) => image.album === album).length
                    }{" "}
                    fotos
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Todas las fotos
          </p>
          <h3 className="mt-1 text-xl font-semibold text-stone-950">
            Galería
          </h3>
        </div>

        <PhotoViewer images={images} />
      </div>
    </section>
  );
}