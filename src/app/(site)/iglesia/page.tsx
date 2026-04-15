import Image from "next/image";
import Link from "next/link";
import { getChurchInfo } from "@/lib/church-info";
import { churchMedia } from "@/lib/church-media";
import InstallGuideCard from "@/components/pwa/install-guide-card";
import {
  Church,
  HeartHandshake,
  MapPinned,
  UserRound,
  Radio,
  Sparkles,
  PlayCircle,
  ArrowRight,
} from "lucide-react";

export default async function IglesiaPage() {
  const churchInfo = await getChurchInfo();

  const churchName = churchInfo?.church_name ?? "Comunidad VID";
  const pastorName = churchInfo?.pastor_name ?? "Jose Luis Aguilar";
  const address =
    churchInfo?.address ??
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";
  const sundayService =
    churchInfo?.sunday_service_time ?? "Domingos · 10:00 AM · Presencial";
  const prayerSchedule =
    churchInfo?.prayer_schedule ??
    "Martes y jueves · 9:00 PM a 10:00 PM · En línea";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  return (
    <div className="px-4 py-6">
      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
          Comunidad
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950">
          Conócenos
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Más que un lugar, somos una comunidad que camina unida en fe.
        </p>
      </div>

      <div className="space-y-5">
        <div className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_18px_36px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-xl">
          <div
            className="relative h-56"
            style={{
              backgroundImage: `url(${churchMedia.heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                <Church size={12} />
                {churchName}
              </div>

              <h2 className="mt-3 text-2xl font-semibold">
                Un lugar para crecer, creer y pertenecer
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/85">
                Queremos recibirte con amor, acompañarte y ayudarte a conectar con
                la vida de la iglesia.
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid gap-3">
              <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  <UserRound size={12} />
                  Pastor
                </div>
                <p className="text-sm leading-6 text-stone-700">{pastorName}</p>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <HeartHandshake size={12} />
                  Visión
                </div>
                <p className="text-sm leading-7 text-stone-700">
                  Ser una comunidad que ama a Dios, sirve a las personas y acompaña
                  a cada vida en su crecimiento espiritual.
                </p>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  <Radio size={12} />
                  Horarios
                </div>
                <p className="text-sm leading-7 text-stone-700">
                  Servicio: {sundayService}
                </p>
                <p className="text-sm leading-7 text-stone-700">
                  Oración: {prayerSchedule}
                </p>
              </div>

              <div className="rounded-3xl border border-stone-100 bg-gradient-to-br from-stone-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                  <MapPinned size={12} />
                  Ubicación
                </div>
                <p className="text-sm leading-7 text-stone-700">{address}</p>

                <Link
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
                >
                  Cómo llegar
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                  <Sparkles size={12} />
                  Comunidad
                </div>
                <p className="text-sm leading-7 text-stone-700">
                  Queremos caminar contigo, recibirte con amor y ayudarte a
                  integrarte a la vida de la iglesia.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
          <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 p-4 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <PlayCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">Así vivimos Comunidad VID</p>
                <p className="text-xs text-stone-300">
                  Un vistazo real a nuestra comunidad
                </p>
              </div>
            </div>
          </div>

          <video
            src={churchMedia.introVideo}
            className="w-full bg-black"
            controls
            muted
            playsInline
            preload="metadata"
          />
        </div>

        <div className="rounded-[30px] border border-stone-200 bg-white p-4 shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
          <h3 className="text-xl font-semibold text-stone-950">
            Galería de la comunidad
          </h3>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            Espacios, reuniones y momentos reales de la iglesia.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {churchMedia.gallery.map((image, index) => (
              <div
                key={image}
                className="relative overflow-hidden rounded-[24px] shadow-sm"
              >
                <Image
                  src={image}
                  alt={`Comunidad VID ${index + 1}`}
                  width={900}
                  height={900}
                  className="h-44 w-full object-cover transition duration-500 hover:scale-[1.03]"
                />
              </div>
            ))}
          </div>
        </div>

        <InstallGuideCard />
      </div>
    </div>
  );
}