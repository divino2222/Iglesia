import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";

export type MinistryPendingItem = {
  id: string;
  name: string;
  position: string | null;
  status: "pending" | "change_requested" | "confirmed";
  note?: string | null;
};

type Props = {
  items: MinistryPendingItem[];
};

function getStatusConfig(
  status: MinistryPendingItem["status"]
) {
  if (status === "change_requested") {
    return {
      label: "Solicitó cambio",
      className:
        "border-red-100 bg-red-50 text-red-700",
      icon: <RefreshCw size={16} />,
    };
  }

  if (status === "confirmed") {
    return {
      label: "Confirmado",
      className:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
      icon: <CheckCircle2 size={16} />,
    };
  }

  return {
    label: "Sin responder",
    className:
      "border-amber-100 bg-amber-50 text-amber-700",
    icon: <Clock3 size={16} />,
  };
}

export default function MinistryPending({
  items,
}: Props) {
  const attentionItems = items.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "change_requested"
  );

  return (
    <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Atención inmediata
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-stone-950">
            Pendientes
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Personas que necesitan seguimiento.
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle size={20} />
        </div>
      </div>

      {attentionItems.length === 0 ? (
        <div className="mt-5 rounded-[24px] border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-emerald-700"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Todo está en orden
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-700">
                Todos los integrantes respondieron y no hay solicitudes
                de cambio pendientes.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {attentionItems.map((item) => {
            const status = getStatusConfig(item.status);

            return (
              <article
                key={item.id}
                className="rounded-[24px] border border-stone-100 bg-stone-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-950">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-stone-500">
                      {item.position || "Servidor"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${status.className}`}
                  >
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                {item.note ? (
                  <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs leading-5 text-stone-600">
                    {item.note}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}