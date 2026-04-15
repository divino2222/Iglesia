type Props = {
  title: string;
  preacher: string;
};

export default function SermonCard({ title, preacher }: Props) {
  return (
    <div className="min-w-[220px] rounded-2xl bg-white shadow-sm border border-zinc-200 overflow-hidden">
      <div className="h-32 bg-zinc-200" />

      <div className="p-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-zinc-500">{preacher}</p>
      </div>
    </div>
  );
}