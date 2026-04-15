import Link from "next/link";
import { ArrowRight, MapPinned } from "lucide-react";
import { getChurchInfo } from "@/lib/church-info";

export default async function SundayInviteBanner() {
  const churchInfo = await getChurchInfo();

  const churchName = churchInfo?.church_name ?? "Comunidad VID";
  const sundayService = "Domingos · 10:00 AM a 1:00 PM · Presencial";
  const address =
    churchInfo?.address ??
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  return (
    <div className="overflow-hidden rounded-[30px] border border-zinc-900/80 bg-zinc-950 p-5 text-white shadow-[0_18px_36px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
        Próxima reunión
      </p>

      <h2 className="mt-2 text-xl font-semibold">Te esperamos este domingo</h2>

      <p className="mt-2 text-sm leading-6 text-zinc-300">
        Ven a compartir con {churchName} en nuestro servicio presencial.
      </p>

      <div className="mt-4 space-y-2 text-sm text-zinc-200">
        <p>{sundayService}</p>
        <p className="leading-6">{address}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/visita"
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-zinc-900"
        >
          Planifica tu visita
          <ArrowRight size={16} />
        </Link>

        <Link
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-zinc-900"
        >
          <MapPinned size={16} />
          Cómo llegar
        </Link>
      </div>
    </div>
  );
}