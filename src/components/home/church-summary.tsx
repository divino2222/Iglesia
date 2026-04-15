import { getChurchInfo } from "@/lib/church-info";

export default async function ChurchSummary() {
  const churchInfo = await getChurchInfo();

  if (!churchInfo) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">
        {churchInfo.church_name}
      </h2>

      {churchInfo.pastor_name ? (
        <p className="mt-2 text-sm text-zinc-600">
          Pastor: {churchInfo.pastor_name}
        </p>
      ) : null}

      {churchInfo.sunday_service_time ? (
        <p className="mt-1 text-sm text-zinc-600">
          Servicio: {churchInfo.sunday_service_time}
        </p>
      ) : null}

      {churchInfo.prayer_schedule ? (
        <p className="mt-1 text-sm text-zinc-600">
          Oración: {churchInfo.prayer_schedule}
        </p>
      ) : null}
    </div>
  );
}