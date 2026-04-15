import Link from "next/link";
import {
  MapPinned,
  CalendarDays,
  Users,
  MessageCircle,
  ChevronRight,
  Church,
  Radio,
  Sparkles,
} from "lucide-react";
import { getChurchInfo } from "@/lib/church-info";
import { churchMedia } from "@/lib/church-media";

export default async function VisitPage() {
  const churchInfo = await getChurchInfo();

  const churchName = churchInfo?.church_name ?? "Comunidad VID";
  const address =
    churchInfo?.address ??
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";
  const sundayService = "Domingos · 10:00 AM a 1:00 PM · Presencial";
  const prayerSchedule = "Martes y jueves · 9:00 PM a 10:00 PM · En línea";
  const leadershipSchedule = "Miércoles · 8:00 PM a 9:00 PM · En línea";
  const pastorName = churchInfo?.pastor_name ?? "Jose Luis Aguilar";
  const whatsappNumber = churchInfo?.whatsapp_number?.trim() || "525520035631";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hola, quiero planificar mi visita a ${churchName}.`
  )}`;

  return (
    <div className="px-4 py-6">
      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
          Primera vez
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950">
          Planifica tu visita
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Queremos que tu llegada a {churchName} sea sencilla, clara y cálida.
        </p>
      </div>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
          <div
            className="relative h-56"
            style={{
              backgroundImage: `url(${churchMedia.heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                <Church size={12} />
                Te esperamos
              </div>

              <h2 className="mt-3 text-2xl font-semibold">
                Este domingo en {churchName}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/85">
                Ven a compartir con nosotros un tiempo de adoración, palabra y comunidad.
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  <CalendarDays size={12} />
                  Servicio
                </div>
                <p className="text-sm leading-6 text-stone-700">
                  {sundayService}
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <Users size={12} />
                  Pastor
                </div>
                <p className="text-sm leading-6 text-stone-700">{pastorName}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  <Radio size={12} />
                  Oración
                </div>
                <p className="text-sm leading-6 text-stone-700">
                  {prayerSchedule}
                </p>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                  <Sparkles size={12} />
                  Liderazgo
                </div>
                <p className="text-sm leading-6 text-stone-700">
                  {leadershipSchedule}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-stone-100 bg-gradient-to-br from-stone-50 to-white p-4">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                <MapPinned size={12} />
                Ubicación
              </div>
              <p className="text-sm leading-7 text-stone-700">{address}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
              >
                <MapPinned size={16} />
                Cómo llegar
              </Link>

              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
              >
                <MessageCircle size={16} />
                Avisar que voy
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-xl">
          <h2 className="text-xl font-semibold text-stone-950">
            Lo que puedes esperar
          </h2>

          <div className="mt-4 grid gap-3">
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                <Users size={12} />
                Ambiente
              </div>
              <p className="text-sm leading-6 text-stone-700">
                Un espacio amigable, cercano y enfocado en Jesús.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <Church size={12} />
                Reunión principal
              </div>
              <p className="text-sm leading-6 text-stone-700">
                Nuestro servicio principal es los domingos de 10:00 AM a 1:00 PM.
              </p>
            </div>

            <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                <MessageCircle size={12} />
                ¿Necesitas ayuda?
              </div>
              <p className="text-sm leading-6 text-stone-700">
                Puedes escribirnos por WhatsApp y con gusto te acompañamos antes de tu visita.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Link
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
            >
              Ver ubicación
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}