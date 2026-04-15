import { getChurchInfo } from "@/lib/church-info";

export default async function MinisteriosPage() {
  const churchInfo = await getChurchInfo();

  const ministries = [
    {
      name: "Noches de oración",
      description:
        "Un tiempo para buscar a Dios, interceder y fortalecer la fe juntos.",
      schedule:
        churchInfo?.prayer_schedule ?? "Martes y jueves · 9:00 PM a 10:00 PM",
    },
    {
      name: "Grupo de liderazgo",
      description:
        "Espacio de formación, dirección y crecimiento para líderes.",
      schedule: churchInfo?.leadership_schedule ?? "Miércoles · 8:00 PM",
    },
    {
      name: "Servicio general",
      description:
        "Nuestra reunión principal de adoración, palabra y comunidad.",
      schedule: churchInfo?.sunday_service_time ?? "Domingos · 10:00 AM",
    },
  ];

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reuniones y ministerios</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Conoce los espacios donde puedes conectar y crecer en{" "}
          {churchInfo?.church_name ?? "Comunidad VID"}.
        </p>
      </div>

      <div className="space-y-4">
        {ministries.map((ministry) => (
          <div
            key={ministry.name}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-base font-semibold">{ministry.name}</h2>
            <p className="mt-2 text-sm text-zinc-600">{ministry.description}</p>
            <p className="mt-3 text-sm font-medium text-zinc-800">
              {ministry.schedule}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}