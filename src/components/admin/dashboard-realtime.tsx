"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Radio,
  UsersRound,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DashboardRealtimeProps = {
  servicePlanId: string;
};

type ToastState = {
  id: number;
  title: string;
  description: string;
  type: "success" | "warning" | "info";
};

type ActivityPayload = {
  new?: {
    action?: string;
    description?: string;
    service_plan_id?: string;
  };
};

function getToastType(action?: string): ToastState["type"] {
  if (
    action === "confirmed_service" ||
    action === "admin_confirmed_assignment" ||
    action === "resolved_change_request"
  ) {
    return "success";
  }

  if (
    action === "requested_change" ||
    action === "reopened_change_request"
  ) {
    return "warning";
  }

  return "info";
}

function getToastTitle(action?: string) {
  switch (action) {
    case "confirmed_service":
    case "admin_confirmed_assignment":
      return "Asistencia confirmada";

    case "requested_change":
      return "Nueva solicitud de cambio";

    case "resolved_change_request":
      return "Solicitud resuelta";

    case "reopened_change_request":
      return "Solicitud reabierta";

    case "assigned_leader":
      return "Responsable asignado";

    case "updated_members":
      return "Integrantes actualizados";

    case "updated_service_team":
      return "Equipo actualizado";

    case "updated_service_plan":
      return "Servicio actualizado";

    default:
      return "Actividad nueva";
  }
}

export default function DashboardRealtime({
  servicePlanId,
}: DashboardRealtimeProps) {
  const router = useRouter();

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const supabase = createClient();

    function refreshDashboard() {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }

      refreshTimer.current = setTimeout(() => {
        setLastUpdate(new Date());
        router.refresh();
      }, 400);
    }

    function showToast(
      title: string,
      description: string,
      type: ToastState["type"]
    ) {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }

      setToast({
        id: Date.now(),
        title,
        description,
        type,
      });

      toastTimer.current = setTimeout(() => {
        setToast(null);
      }, 6000);
    }

    const channel = supabase
      .channel(`admin-dashboard-${servicePlanId}`)

      /*
       * Activity Log genera la notificación visible.
       */
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_log",
          filter: `service_plan_id=eq.${servicePlanId}`,
        },
        (payload) => {
          const activity = (payload as ActivityPayload).new;

          showToast(
            getToastTitle(activity?.action),
            activity?.description || "Se registró una nueva actividad.",
            getToastType(activity?.action)
          );

          refreshDashboard();
        }
      )

      /*
       * Estas tablas actualizan métricas, preparación y tarjetas.
       */
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_assignments",
          filter: `service_plan_id=eq.${servicePlanId}`,
        },
        refreshDashboard
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_teams",
          filter: `service_plan_id=eq.${servicePlanId}`,
        },
        refreshDashboard
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_plans",
          filter: `id=eq.${servicePlanId}`,
        },
        refreshDashboard
      )
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setConnected(false);
        }

        if (error) {
          console.error("Error de Supabase Realtime:", error);
        }
      });

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }

      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [router, servicePlanId]);

  const connectionClasses = connected
    ? {
        container: "border-emerald-100 bg-emerald-50",
        icon: "bg-emerald-100 text-emerald-700",
        title: "text-emerald-800",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      }
    : {
        container: "border-amber-100 bg-amber-50",
        icon: "bg-amber-100 text-amber-700",
        title: "text-amber-800",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };

  return (
    <>
      <div
        className={`flex items-center justify-between gap-3 rounded-[24px] border px-4 py-3 ${connectionClasses.container}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${connectionClasses.icon}`}
          >
            <Radio size={18} />

            {connected ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
              </span>
            ) : null}
          </span>

          <div className="min-w-0">
            <p
              className={`truncate text-sm font-semibold ${connectionClasses.title}`}
            >
              {connected
                ? "Centro de Operaciones en tiempo real"
                : "Conectando actualizaciones"}
            </p>

            <p className={`mt-0.5 text-xs ${connectionClasses.text}`}>
              {lastUpdate
                ? `Último cambio recibido a las ${lastUpdate.toLocaleTimeString(
                    "es-MX",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }
                  )}`
                : "Los movimientos aparecerán automáticamente."}
            </p>
          </div>
        </div>

        <span
          className={`h-3 w-3 shrink-0 rounded-full ${connectionClasses.dot}`}
        />
      </div>

      {toast ? (
        <RealtimeToast
          key={toast.id}
          toast={toast}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );
}

function RealtimeToast({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  const styles = {
    success: {
      card: "border-emerald-200 bg-white",
      icon: "bg-emerald-100 text-emerald-700",
      progress: "bg-emerald-500",
    },
    warning: {
      card: "border-amber-200 bg-white",
      icon: "bg-amber-100 text-amber-700",
      progress: "bg-amber-500",
    },
    info: {
      card: "border-sky-200 bg-white",
      icon: "bg-sky-100 text-sky-700",
      progress: "bg-sky-500",
    },
  }[toast.type];

  return (
    <div className="fixed inset-x-4 top-4 z-[100] mx-auto max-w-md animate-in slide-in-from-top-4 duration-300 sm:left-auto sm:right-6 sm:top-6 sm:mx-0 sm:w-[390px]">
      <div
        className={`relative overflow-hidden rounded-[26px] border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${styles.card}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : toast.type === "warning" ? (
              <AlertTriangle size={20} />
            ) : (
              <UsersRound size={20} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-950">
              {toast.title}
            </p>

            <p className="mt-1 text-sm leading-5 text-stone-600">
              {toast.description}
            </p>

            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Ahora mismo
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notificación"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-stone-100">
          <div
            className={`h-full origin-left animate-[realtime-progress_6s_linear_forwards] ${styles.progress}`}
          />
        </div>
      </div>
    </div>
  );
}