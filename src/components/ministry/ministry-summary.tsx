type Props = {
  members: number;
  confirmed: number;
  pending: number;
  changes: number;
};

export default function MinistrySummary({
  members,
  confirmed,
  pending,
  changes,
}: Props) {
  const cards = [
    {
      title: "Integrantes",
      value: members,
    },
    {
      title: "Confirmados",
      value: confirmed,
    },
    {
      title: "Pendientes",
      value: pending,
    },
    {
      title: "Cambios",
      value: changes,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-4">

      {cards.map((card) => (

        <article
          key={card.title}
          className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
            {card.title}
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            {card.value}
          </h2>
        </article>

      ))}

    </section>
  );
}