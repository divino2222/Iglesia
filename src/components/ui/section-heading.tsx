type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: Props) {
  return (
    <div className="mb-4">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="mt-1 text-xl font-semibold tracking-tight text-stone-950">
        {title}
      </h2>

      {subtitle ? (
        <p className="mt-1 text-sm leading-6 text-stone-500">{subtitle}</p>
      ) : null}
    </div>
  );
}