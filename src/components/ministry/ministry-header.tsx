type Props = {
  ministry: string;
  leader: string;
  position: string;
  nextService: string;
  confirmed: number;
  total: number;
};

export default function MinistryHeader({
  ministry,
  leader,
  position,
  nextService,
  confirmed,
  total,
}: Props) {
  const progress =
    total === 0
      ? 0
      : Math.round((confirmed / total) * 100);

  return (
    <section className="overflow-hidden rounded-[34px] bg-stone-950 text-white shadow-xl">
      <div className="p-7">

        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
          Comunidad VID
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Ministerio de {ministry}
        </h1>

        <p className="mt-2 text-white/70">
          {leader}
        </p>

        <p className="text-sm text-white/50">
          {position}
        </p>

        <div className="mt-8 rounded-3xl bg-white/10 p-5">

          <div className="flex items-center justify-between">

            <span className="text-sm text-white/70">
              Próximo servicio
            </span>

            <span className="font-semibold">
              {nextService}
            </span>

          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">

            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <div className="mt-3 flex items-center justify-between text-sm">

            <span className="text-white/60">
              Confirmaciones
            </span>

            <span className="font-semibold">
              {confirmed} / {total}
            </span>

          </div>

        </div>

      </div>
    </section>
  );
}