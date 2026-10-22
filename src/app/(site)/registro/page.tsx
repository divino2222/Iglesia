import { redirect } from "next/navigation";
import {
  HeartHandshake,
  Mic2,
} from "lucide-react";

import RegisterForm from "@/components/auth/register-form";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{
    ministerio?: string;
  }>;
};

const ministryLabels: Record<
  string,
  string
> = {
  alabanza: "Alabanza",
  cafeteria: "Cafetería",
  multimedia: "Multimedia",
  ninos: "Niños",
  ofrendas: "Ofrendas",
  ujieres: "Ujieres",
};

export default async function RegistroPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  const ministrySlug =
    params?.ministerio
      ?.trim()
      .toLowerCase() || null;

  const ministryName =
    ministrySlug &&
    ministryLabels[
      ministrySlug
    ]
      ? ministryLabels[
          ministrySlug
        ]
      : null;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  /*
   * Si ya inició sesión y llegó
   * desde "Quiero servir",
   * más adelante lo mandaremos
   * directamente al flujo de solicitud.
   *
   * Por ahora conservamos
   * el comportamiento actual.
   */
  if (user) {
    if (ministrySlug) {
      redirect(
        `/mi-cuenta?ministerio=${encodeURIComponent(
          ministrySlug
        )}`
      );
    }

    redirect("/mi-cuenta");
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
          {/* CABECERA */}

          <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 px-6 py-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <HeartHandshake
                size={13}
              />

              Comunidad VID
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Crea tu cuenta
            </h1>

            {ministryName ? (
              <>
                <p className="mt-2 text-sm leading-6 text-emerald-50">
                  Crea tu cuenta para continuar con tu interés en servir en{" "}
                  <strong>
                    {ministryName}
                  </strong>
                  .
                </p>

                <div className="mt-5 flex items-center gap-3 rounded-[22px] bg-white/15 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <Mic2
                      size={18}
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/65">
                      Área seleccionada
                    </p>

                    <p className="mt-1 font-semibold">
                      {ministryName}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm leading-6 text-emerald-50">
                Tu cuenta será la puerta de entrada a una experiencia más
                personalizada dentro de Comunidad VID.
              </p>
            )}
          </div>

          {/* FORMULARIO */}

          <div className="p-5">
            <RegisterForm
              ministry={
                ministrySlug
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}