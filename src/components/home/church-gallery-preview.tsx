import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Camera } from "lucide-react";
import { churchMedia } from "@/lib/church-media";

export default function ChurchGalleryPreview() {
  return (
    <div className="rounded-[30px] border border-stone-200 bg-white p-4 shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
            <Camera size={12} />
            Comunidad
          </div>
          <h3 className="mt-2 text-xl font-semibold text-stone-950">
            Momentos de nuestra iglesia
          </h3>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            Un vistazo real a lo que vivimos en Comunidad VID.
          </p>
        </div>

        <Link
          href="/iglesia"
          className="hidden items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 sm:inline-flex"
        >
          Ver más
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {churchMedia.gallery.map((image, index) => (
          <div
            key={image}
            className="relative overflow-hidden rounded-[24px] shadow-sm"
          >
            <Image
              src={image}
              alt={`Comunidad VID ${index + 1}`}
              width={800}
              height={800}
              className="h-40 w-full object-cover transition duration-500 hover:scale-[1.03]"
            />
          </div>
        ))}
      </div>

      <Link
        href="/iglesia"
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 sm:hidden"
      >
        Ver más
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}