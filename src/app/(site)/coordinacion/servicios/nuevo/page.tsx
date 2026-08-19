import Link from "next/link";
import {
  ArrowLeft,
  CalendarPlus2,
} from "lucide-react";

import { requireAllPermissions } from "@/lib/auth/permissions";

import ServicePlanForm from "./service-plan-form";

export default async function NewServicePage() {
  await requireAllPermissions(
    [
      "services.create",
      "teams.manage",
    ],
    {
      redirectTo: "/sin-acceso",
    }
  );

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-6">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/coordinacion"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
        >
          <ArrowLeft size={17} />
          Regresar
        </Link>

        <header className="mt-5 overflow-hidden rounded-[32px] bg-stone-950 p-6 text-white shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <CalendarPlus2 size={23} />
          </div>

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Coordinación General
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Nuevo servicio
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-white/65">
            Registra el próximo servicio. Los equipos
            ministeriales se crearán automáticamente.
          </p>
        </header>

        <section className="mt-5 rounded-[32px] border border-stone-200 bg-white p-5 shadow-sm">
          <ServicePlanForm />
        </section>
      </div>
    </main>
  );
}