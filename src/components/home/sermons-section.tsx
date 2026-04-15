import Link from "next/link";
import { PlayCircle, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChurchInfo } from "@/lib/church-info";

type Sermon = {
  id: number;
  title: string;
  preacher: string | null;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

export default async function SermonsSection() {
  const supabase = await createClient();
  const churchInfo = await getChurchInfo();

  const { data, error } = await supabase
    .from("sermons")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return (
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-stone-900">
          Últimas predicaciones
        </h2>
        <p className="mt-3 text-sm text-red-600">
          No se pudieron cargar las predicaciones.
        </p>
      </div>
    );
  }

  const sermons = (data ?? []) as Sermon[];
  const pastorName = churchInfo?.pastor_name ?? "Jose Luis Aguilar";

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">
          Últimas predicaciones
        </h2>

        <Link
          href="/predicaciones"
          className="text-sm font-medium text-stone-700 underline-offset-4 hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {sermons.map((sermon) => (
          <Link
            key={sermon.id}
            href={`/predicaciones/${sermon.id}`}
            className="min-w-[245px] overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className="relative h-36"
              style={{
  backgroundImage: `url(${sermon.thumbnail_url || "/images/sermon-placeholder.svg"})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
}}
            >
              <div className="absolute inset-0 bg-black/10" />

              <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-stone-800 shadow-sm backdrop-blur">
                <PlayCircle size={13} />
                Mensaje
              </div>
            </div>

            <div className="p-4">
              <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-stone-900">
                {sermon.title}
              </h3>

              <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                <UserRound size={14} className="text-stone-400" />
                <span>{sermon.preacher?.trim() || pastorName}</span>
              </div>

              {sermon.description ? (
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-stone-600">
                  {sermon.description}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}