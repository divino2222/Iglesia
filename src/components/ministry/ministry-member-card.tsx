import {
  CheckCircle2,
  Clock3,
  MinusCircle,
  RefreshCw,
} from "lucide-react";

export type MinistryMember = {
  id: string;
  name: string;
  position: string;
  status:
    | "confirmed"
    | "pending"
    | "change_requested"
    | "not_assigned";
};

type Props = {
  member: MinistryMember;
};

export default function MinistryMemberCard({
  member,
}: Props) {
  const status =
    member.status === "confirmed"
      ? {
          text: "Confirmado",
          color:
            "border-emerald-100 bg-emerald-50 text-emerald-700",
          icon: <CheckCircle2 size={15} />,
        }
      : member.status ===
          "change_requested"
        ? {
            text: "Solicitó cambio",
            color:
              "border-red-100 bg-red-50 text-red-700",
            icon: <RefreshCw size={15} />,
          }
        : member.status === "pending"
          ? {
              text: "Pendiente",
              color:
                "border-amber-100 bg-amber-50 text-amber-700",
              icon: <Clock3 size={15} />,
            }
          : {
              text: "No asignado",
              color:
                "border-stone-200 bg-stone-100 text-stone-500",
              icon: <MinusCircle size={15} />,
            };

  return (
    <button
      type="button"
      className="w-full rounded-3xl border border-stone-200 bg-white p-4 text-left transition hover:border-stone-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-stone-950">
            {member.name}
          </h3>

          <p className="mt-1 truncate text-sm text-stone-500">
            {member.position}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${status.color}`}
        >
          {status.icon}
          {status.text}
        </span>
      </div>
    </button>
  );
}