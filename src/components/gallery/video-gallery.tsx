import { PlayCircle, Video } from "lucide-react";
import { churchMedia } from "@/lib/church-media";

export default function VideoGallery() {
  const videos = churchMedia.videos ?? [];

  if (!videos.length) return null;

  return (
    <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700">
        <Video size={13} />
        Videos
      </div>

      <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
        Videos de Comunidad VID
      </h2>

      <p className="mt-2 text-sm leading-6 text-stone-600">
        Reproducciones dentro de la app para ver momentos especiales de nuestra comunidad.
      </p>

      <div className="mt-5 space-y-4">
        {videos.map((video) => (
          <article
            key={video.id}
            className="overflow-hidden rounded-[28px] border border-stone-100 bg-stone-50"
          >
            <div className="relative bg-black">
              <video
                src={video.src}
                poster={video.poster}
                controls
                preload="metadata"
                className="h-56 w-full object-cover"
              />

              <div className="pointer-events-none absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-stone-950 shadow-sm">
                <PlayCircle size={22} />
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-stone-950">
                {video.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                {video.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}