import Link from "next/link";
import { PlayCircle, UserRound, CalendarDays } from "lucide-react";
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function SermonsPage() {
  const supabase = await createClient();
  const churchInfo = await getChurchInfo();

  const { data, error } = await supabase
    .from("sermons")
    .select("*")
    .order("created_at", { ascending: false });

  const sermons = (data ?? []) as Sermon[];
  const pastorName = churchInfo?.pastor_name ?? "Jose Luis Aguilar";

  return (
    <div className="px-4 py-6">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          Predicaciones
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Escucha los mensajes y enseñanzas de Comunidad VID.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600">
          No se pudieron cargar las predicaciones.
        </p>
      ) : sermons.length === 0 ? (
        <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-600">
            Aún no hay predicaciones publicadas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sermons.map((sermon) => (
            <Link
              key={sermon.id}
              href={`/predicaciones/${sermon.id}`}
              className="block overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className="relative h-44 overflow-hidden"
                style={
                  sermon.thumbnail_url
                    ? {
                        backgroundImage: `url(${sermon.thumbnail_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {
                        background:
                          "linear-gradient(135deg, #e7e5e4 0%, #f5f5f4 50%, #d6d3d1 100%)",
                      }
                }
              >
                <div className="absolute inset-0 bg-black/10" />

                <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm backdrop-blur">
                  <PlayCircle size={14} />
                  Mensaje
                </div>
              </div>

              <div className="p-5">
                <h2 className="text-lg font-semibold leading-snug text-stone-900">
                  {sermon.title}
                </h2>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-500">
                  <div className="flex items-center gap-2">
                    <UserRound size={16} className="text-stone-400" />
                    <span>{sermon.preacher?.trim() || pastorName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-stone-400" />
                    <span>{formatDate(sermon.created_at)}</span>
                  </div>
                </div>

                {sermon.description ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">
                    {sermon.description}
                  </p>
                ) : null}

                <div className="mt-5 inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                  Ver detalle
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}