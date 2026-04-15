import Link from "next/link";
import {
  ChevronRight,
  MapPinned,
  UserRound,
  Radio,
  Church,
} from "lucide-react";
import { getChurchInfo } from "@/lib/church-info";

export default async function ChurchInfoCard() {
  const churchInfo = await getChurchInfo();

  const churchName = churchInfo?.church_name ?? "Comunidad VID";
  const pastorName = churchInfo?.pastor_name ?? "Jose Luis Aguilar";
  const sundayService =
    churchInfo?.sunday_service_time ?? "Domingos · 10:00 AM · Presencial";
  const prayerSchedule =
    churchInfo?.prayer_schedule ??
    "Martes y jueves · 9:00 PM a 10:00 PM · En línea";
  const address =
    churchInfo?.address ??
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
            <Church size={18} />
          </div>
          <div>
            <p className="text-xl font-semibold text-stone-900">{churchName}</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-stone-500">
              <UserRound size={14} />
              <span>Pastor: {pastorName}</span>
            </div>
          </div>
        </div>

        <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-700">
          Iglesia local
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-4">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            <Church size={12} />
            Servicio
          </div>
          <p className="text-sm leading-6 text-stone-800">{sundayService}</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-4 py-4">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <Radio size={12} />
            Oración
          </div>
          <p className="text-sm leading-6 text-stone-800">{prayerSchedule}</p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-stone-100 bg-gradient-to-br from-stone-50 to-white px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Ubicación del servicio
        </p>
        <p className="mt-2 text-sm leading-7 text-stone-800">{address}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
        >
          <MapPinned size={17} />
          Cómo llegar
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}