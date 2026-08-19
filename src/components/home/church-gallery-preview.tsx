import Link from "next/link";
import { Camera, ChevronRight, Images, PlayCircle } from "lucide-react";
import { churchMedia } from "@/lib/church-media";

export default function ChurchGalleryPreview() {
  const images = churchMedia.images?.slice(0, 4) ?? [];
  const videoCount = churchMedia.videos?.length ?? 0;

  return (
    <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
              <Images size={13} />
              Galería
            </div>

            <h3 className="text-xl font-semibold text-stone-950">
              Fotos y videos
            </h3>

            <p className="mt-1 text-sm leading-6 text-stone-600">
              Momentos reales de Comunidad VID dentro de la app.
            </p>
          </div>

          <Link
            href="/galeria"
            className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
          >
            Ver
            <ChevronRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative h-32 overflow-hidden rounded-[22px] bg-stone-100"
              style={{
                backgroundImage: `url(${image.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {index === 3 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                  Ver más
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[22px] border border-violet-100 bg-violet-50 p-4 text-violet-700">
            <Camera size={20} />
            <p className="mt-2 text-sm font-semibold">
              {churchMedia.images?.length ?? 0} fotos
            </p>
          </div>

          <div className="rounded-[22px] border border-red-100 bg-red-50 p-4 text-red-700">
            <PlayCircle size={20} />
            <p className="mt-2 text-sm font-semibold">
              {videoCount} videos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}