"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";

import { toggleChecklistItem } from "@/app/(site)/mi-servicio/actions";

type Props = {
  assignmentId: string;
  item: string;
  completed: boolean;
};

export default function PersonalChecklistItem({
  assignmentId,
  item,
  completed,
}: Props) {
  const [isPending, startTransition] =
    useTransition();

  function handleChange() {
    const formData = new FormData();

    formData.set(
      "assignment_id",
      assignmentId
    );

    formData.set("item", item);

    formData.set(
      "completed",
      completed ? "false" : "true"
    );

    startTransition(async () => {
      await toggleChecklistItem(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={handleChange}
      disabled={isPending}
      className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3 text-left text-sm transition ${
        completed
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-stone-100 bg-stone-50 text-stone-700"
      } ${
        isPending
          ? "opacity-60"
          : ""
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-stone-300 bg-white"
        }`}
      >
        {completed ? (
          <CheckCircle2 size={14} />
        ) : null}
      </span>

      <span
        className={
          completed
            ? "font-medium line-through opacity-70"
            : "font-medium"
        }
      >
        {item}
      </span>
    </button>
  );
}