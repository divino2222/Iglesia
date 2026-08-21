import Link from "next/link";
import {
  CalendarDays,
  Church,
  Clock3,
  MapPin,
  MessageCircle,
} from "lucide-react";

import { getChurchInfo } from "@/lib/church-info";

import {
  getAppCurrentMinutes,
  getAppTodayString,
  getAppWeekday,
} from "@/lib/date-time";

const SUNDAY_SERVICE_MINUTES = 11 * 60;

function buildWhatsAppUrl(
  whatsappNumber: string,
  message: string
) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;
}

export default async function TodaySundayBanner() {
  const today =
    getAppTodayString();

  const weekday =
    getAppWeekday(today);

  /*
   * 0 = domingo.
   *
   * Si no es domingo,
   * el componente no renderiza nada.
   */
  if (weekday !== 0) {
    return null;
  }

  const churchInfo =
    await getChurchInfo();

  const whatsappNumber =
    churchInfo?.whatsapp_number?.trim() ||
    "525520035631";

  const address =
    churchInfo?.address ||
    "Josefa Ortiz de Domínguez MZ99 LT1212, Sta María Aztahuacan, Iztapalapa, 09570 Ciudad de México, CDMX";

  const currentMinutes =
    getAppCurrentMinutes();

  const serviceStarted =
    currentMinutes >=
    SUNDAY_SERVICE_MINUTES;

  const whatsappUrl =
    buildWhatsAppUrl(
      whatsappNumber,
      serviceStarted
        ? "Hola, quiero información sobre el servicio dominical de hoy en Comunidad VID."
        : "Hola, quiero información para asistir hoy al servicio dominical de Comunidad VID."
    );

  return (
    <section className="overflow-hidden rounded-[34px] border border-sky-100 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <div className="bg-gradient-to-br from-sky-700 via-sky-600 to-blue-500 px-5 py-6 text-white">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
          <CalendarDays size={13} />

          Domingo en Comunidad VID
        </div>

        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          {serviceStarted
            ? "Nuestro servicio de hoy ya comenzó"
            : "Hoy nos reunimos 🙌"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-sky-50">
          {serviceStarted
            ? "Todavía puedes encontrar aquí la información del servicio de hoy."
            : "Nos encantará recibirte hoy. Ven con tu familia y acompáñanos."}
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[22px] border border-stone-100 bg-stone-50 p-4">
            <Clock3
              size={18}
              className="text-stone-500"
            />

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              Servicio
            </p>

            <p className="mt-1 text-lg font-semibold text-stone-950">
              11:00 AM
            </p>
          </div>

          <div className="rounded-[22px] border border-stone-100 bg-stone-50 p-4">
            <Church
              size={18}
              className="text-stone-500"
            />

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              Modalidad
            </p>

            <p className="mt-1 text-lg font-semibold text-stone-950">
              Presencial
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-stone-100 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <MapPin size={18} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                Dirección
              </p>

              <p className="mt-1 text-sm leading-6 text-stone-700">
                {address}
              </p>
            </div>
          </div>
        </div>

        <Link
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-stone-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(0,0,0,0.14)]"
        >
          <MessageCircle size={18} />

          {serviceStarted
            ? "Solicitar información"
            : "Quiero asistir hoy"}
        </Link>
      </div>
    </section>
  );
}