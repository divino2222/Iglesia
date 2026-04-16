import { HeartHandshake, UserRound, Clock3 } from "lucide-react";
import { getPrayerLeaderState } from "@/lib/prayer-leader";

export default async function PrayerLeaderCard() {
  const prayer = await getPrayerLeaderState();

  if (!prayer.currentLeader && !prayer.nextLeader) return null;

  return (
    <div className="overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.06)]">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 text-white">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
          <HeartHandshake size={12} />
          Oración
        </div>

        <h3 className="mt-3 text-xl font-semibold tracking-tight">
          {prayer.isPrayerActiveNow ? "Dirige hoy" : "Próxima dirección de oración"}
        </h3>
      </div>

      <div className="p-5">
        {prayer.isPrayerActiveNow && prayer.currentLeader ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <UserRound size={18} />
              </div>
              <div>
                <p className="text-sm text-stone-500">Dirige hoy</p>
                <p className="text-lg font-semibold text-stone-950">
                  {prayer.currentLeader}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Clock3 size={15} className="text-stone-400" />
              9:00 PM a 10:00 PM · En línea
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <UserRound size={18} />
              </div>
              <div>
                <p className="text-sm text-stone-500">Dirige</p>
                <p className="text-lg font-semibold text-stone-950">
                  {prayer.nextLeader}
                </p>
              </div>
            </div>

            <div className="text-sm leading-6 text-stone-600">
              {prayer.nextDateLabel} · 9:00 PM a 10:00 PM · En línea
            </div>
          </div>
        )}
      </div>
    </div>
  );
}