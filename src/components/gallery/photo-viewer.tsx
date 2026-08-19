"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ChurchGalleryImage } from "@/lib/church-media";

type PhotoViewerProps = {
  images: ChurchGalleryImage[];
};

export default function PhotoViewer({ images }: PhotoViewerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeImage =
    activeIndex !== null && images[activeIndex] ? images[activeIndex] : null;

  function closeViewer() {
    setActiveIndex(null);
  }

  function showPrevious() {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex - 1 + images.length) % images.length);
  }

  function showNext() {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % images.length);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (activeIndex === null) return;

      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group overflow-hidden rounded-[24px] bg-stone-100 text-left shadow-sm"
          >
            <div
              className="h-36 transition duration-300 group-hover:scale-105"
              style={{
                backgroundImage: `url(${image.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            <div className="p-3">
              <p className="text-xs font-semibold text-stone-950">
                {image.album}
              </p>
              {image.caption ? (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-600">
                  {image.caption}
                </p>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      {activeImage ? (
        <div className="fixed inset-0 z-[120] bg-black/95 text-white">
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                {activeIndex! + 1} / {images.length}
              </p>
              <p className="mt-1 text-sm font-semibold">{activeImage.album}</p>
            </div>

            <button
              type="button"
              onClick={closeViewer}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
              aria-label="Cerrar galería"
            >
              <X size={20} />
            </button>
          </div>

          <button
            type="button"
            onClick={showPrevious}
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10"
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            type="button"
            onClick={showNext}
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10"
            aria-label="Imagen siguiente"
          >
            <ChevronRight size={24} />
          </button>

          <div className="flex h-full items-center justify-center px-4">
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="max-h-[78vh] w-full rounded-[28px] object-contain"
            />
          </div>

          {activeImage.caption ? (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent px-5 pb-8 pt-16">
              <p className="text-sm leading-6 text-white/85">
                {activeImage.caption}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}