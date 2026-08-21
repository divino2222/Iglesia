"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
    >
      <LogOut size={17} />
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}