import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import LoginForm from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
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
          <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 px-6 py-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <LockKeyhole size={13} />
              Mi Comunidad
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Bienvenido de nuevo
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Inicia sesión para acceder a tu cuenta y, próximamente, a tu
              servicio personalizado.
            </p>
          </div>

          <div className="p-5">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}