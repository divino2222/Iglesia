import { redirect } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import RegisterForm from "@/components/auth/register-form";
import { createClient } from "@/lib/supabase/server";

export default async function RegistroPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/mi-cuenta");
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
          <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 px-6 py-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <HeartHandshake size={13} />
              Comunidad VID
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Crea tu cuenta
            </h1>

            <p className="mt-2 text-sm leading-6 text-emerald-50">
              Tu cuenta será la puerta de entrada a una experiencia más
              personalizada dentro de Comunidad VID.
            </p>
          </div>

          <div className="p-5">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}