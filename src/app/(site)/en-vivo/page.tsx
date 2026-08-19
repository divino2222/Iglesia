import PrayerPremiumPanel from "@/components/prayer/prayer-premium-panel";

export default function EnVivoPage() {
  return (
    <div className="space-y-6 px-4 py-6">
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
          En vivo
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          En vivo
        </h1>

        <p className="text-sm leading-6 text-stone-600">
          Conéctate con Comunidad VID y acompáñanos en nuestras reuniones en línea.
        </p>
      </section>

      <PrayerPremiumPanel />

      <section className="rounded-[28px] border border-stone-100 bg-white p-5 shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
        <p className="text-sm font-semibold text-stone-950">
          Horarios habituales
        </p>

        <p className="mt-2 text-sm leading-6 text-stone-600">
          Servicio dominical: domingos a las 11:00 AM. Oración en línea: martes
          y jueves de 8:00 PM a 9:00 PM.
        </p>
      </section>
    </div>
  );
}