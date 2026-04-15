import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, PlayCircle, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function SermonDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const churchInfo = await getChurchInfo();

  const { data, error } = await supabase
    .from("sermons")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !data) {
    notFound();
  }

  const pastorName = churchInfo?.pastor_name ?? "Jose Luis Aguilar";

  return (
    <div className="px-4 py-6">
      <Link
        href="/predicaciones"
        className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <div
        className="relative h-56 overflow-hidden rounded-[28px] shadow-sm"
        style={{
          backgroundImage: `url(${data.thumbnail_url || "/images/sermon-placeholder.svg"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/15" />

        <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm backdrop-blur">
          <PlayCircle size={14} />
          Predicación
        </div>
      </div>

      <div className="mt-6">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-stone-950">
          {data.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <UserRound size={16} className="text-stone-400" />
            <span>{data.preacher?.trim() || pastorName}</span>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-stone-400" />
            <span>{formatDate(data.created_at)}</span>
          </div>
        </div>

        {data.description ? (
          <div className="mt-6 rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-stone-900">
              Descripción
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              {data.description}
            </p>
          </div>
        ) : null}

        {data.video_url ? (
          <div className="mt-6">
            <Link
              href={data.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
            >
              <PlayCircle size={18} />
              Ver predicación
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}