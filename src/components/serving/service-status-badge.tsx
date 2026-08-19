import type { ServiceStatus } from "@/data/sunday-service-plan";

export default function ServiceStatusBadge({
  status,
}: {
  status: ServiceStatus;
}) {
  const configs = {
    ready: {
      label: "Confirmado",
      className:
        "border-emerald-200 bg-emerald-100 text-emerald-700",
    },
    pending: {
      label: "Por confirmar",
      className:
        "border-amber-200 bg-amber-100 text-amber-700",
    },
    attention: {
      label: "Revisar",
      className:
        "border-red-200 bg-red-100 text-red-700",
    },
  } as const;

  const config =
    configs[status as keyof typeof configs] ?? {
      label: "Sin estado",
      className:
        "border-stone-200 bg-stone-100 text-stone-600",
    };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}