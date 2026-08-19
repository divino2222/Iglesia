import { Clock3, UserRound, HeartHandshake } from "lucide-react";
import { getPrayerLeaderState } from "@/lib/prayer-leader";

export default async function PrayerLeaderCard() {
  const prayerState = await getPrayerLeaderState();

  if (!prayerState.nextLeader && !prayerState.currentLeader) {
    return null;
  }

  const leaderName = prayerState.isPrayerActiveNow
    ? prayerState.currentLeader
    : prayerState.nextLeader;

  const title = prayerState.isPrayerActiveNow
    ? "Dirige ahora"
    : "Próxima dirección de oración";

  const dateLabel = prayerState.isPrayerActiveNow
    ? "Oración en vivo"
    : prayerState.nextDateLabel || "Próxima oración";

  return (
    <div className="overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-4 text-white">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
          <HeartHandshake size={12} />
          Oración
        </div>

        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <UserRound size={19} />
          </div>

          <div>
            <p className="text-xs text-stone-500">
              {prayerState.isPrayerActiveNow ? "Dirige" : "Dirige"}
            </p>
            <p className="text-lg font-semibold text-stone-950">
              {leaderName || "Por confirmar"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-stone-600">
          <Clock3 size={15} />
          <span>{dateLabel} · 8:00 PM a 9:00 PM · En línea</span>
        </div>
      </div>
    </div>
  );
}