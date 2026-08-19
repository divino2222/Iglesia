import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Headphones,
  UserRound,
  Video,
} from "lucide-react";
import { PRAYER_MEET_URL, prayerSchedule } from "@/data/prayer-schedule";
import {
  formatPrayerDate,
  getGroupedPrayerSchedule,
  getNextPrayerScheduleItem,
  getPrayerStatusClasses,
  getPrayerStatusLabel,
  isPrayerMeetOpen,
} from "@/lib/prayer-schedule";

const WHATSAPP_NUMBER = "525520035631";

function getConfirmUrl(date: string, leader: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, confirmo que sí podré dirigir la oración el ${formatPrayerDate(
      date
    )}. Responsable: ${leader}.`
  )}`;
}

function getChangeUrl(date: string, leader: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, necesito solicitar cambio de fecha para la oración del ${formatPrayerDate(
      date
    )}. Responsable: ${leader}.`
  )}`;
}

export default function PrayerPremiumPanel() {
  const nextPrayer = getNextPrayerScheduleItem();
  const grouped = getGroupedPrayerSchedule();
  const meetOpen = nextPrayer ? isPrayerMeetOpen(nextPrayer.date) : false;

  const nextStatusLabel = nextPrayer
    ? getPrayerStatusLabel(nextPrayer.status)
    : null;

  const nextStatusClasses = nextPrayer
    ? getPrayerStatusClasses(nextPrayer.status)
    : "";

  const nextConfirmUrl = nextPrayer
    ? getConfirmUrl(nextPrayer.date, nextPrayer.leader)
    : "#";

  const nextChangeUrl = nextPrayer
    ? getChangeUrl(nextPrayer.date, nextPrayer.leader)
    : "#";

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-5 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Headphones size={13} />
            Oración en línea
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Próxima oración
          </h2>

          <p className="mt-2 text-sm leading-6 text-emerald-50">
            Martes y jueves de 8:00 PM a 9:00 PM.
          </p>
        </div>

        {nextPrayer ? (
          <div className="space-y-4 p-5">
            <div className="rounded-[28px] border border-stone-100 bg-stone-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CalendarDays size={21} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Fecha
                  </p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">
                    {formatPrayerDate(nextPrayer.date)}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                    <Clock3 size={15} />
                    8:00 PM a 9:00 PM · En línea
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700">
                    <UserRound size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Responsable
                    </p>
                    <p className="text-lg font-semibold text-stone-950">
                      {nextPrayer.leader}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-stone-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                    <CheckCircle2 size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Estado
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${nextStatusClasses}`}
                    >
                      {nextStatusLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href={nextConfirmUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center rounded-[20px] bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Confirmo
              </Link>

              <Link
                href={nextChangeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center rounded-[20px] bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-200"
              >
                Solicitar cambio
              </Link>
            </div>

            <Link
              href={meetOpen ? PRAYER_MEET_URL : "#"}
              target={meetOpen ? "_blank" : undefined}
              rel={meetOpen ? "noreferrer" : undefined}
              aria-disabled={!meetOpen}
              className={`flex w-full items-center justify-center gap-2 rounded-[24px] px-5 py-4 text-sm font-semibold shadow transition ${
                meetOpen
                  ? "bg-stone-950 text-white hover:bg-stone-800"
                  : "pointer-events-none bg-stone-200 text-stone-500"
              }`}
            >
              <Video size={18} />
              {meetOpen
                ? "Entrar a Google Meet"
                : "Google Meet disponible a las 8:00 PM"}
            </Link>
          </div>
        ) : (
          <div className="p-5 text-sm text-stone-600">
            No hay próximas oraciones registradas.
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-[34px] border border-white/60 bg-white/80 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
        <div className="border-b border-stone-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
            Calendario
          </p>
          <h3 className="mt-1 text-xl font-semibold text-stone-950">
            Responsables de oración
          </h3>
        </div>

        <div className="space-y-5 p-5">
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                {month}
              </p>

              <div className="space-y-2">
                {items.map((item) => {
                  const statusLabel = getPrayerStatusLabel(item.status);
                  const statusClasses = getPrayerStatusClasses(item.status);
                  const confirmUrl = getConfirmUrl(item.date, item.leader);
                  const changeUrl = getChangeUrl(item.date, item.leader);

                  return (
                    <div
                      key={item.date}
                      className="rounded-[22px] border border-stone-100 bg-stone-50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-950">
                            {formatPrayerDate(item.date)}
                          </p>
                          <p className="text-sm text-stone-600">
                            {item.leader}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses}`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={confirmUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Confirmo
                        </Link>

                        <Link
                          href={changeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
                        >
                          Solicitar cambio
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {prayerSchedule.length === 0 ? (
            <p className="text-sm text-stone-600">
              Todavía no hay responsables registrados.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}