import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/* =========================================================
   USUARIO AUTENTICADO COMPARTIDO

   cache() evita repetir auth.getUser()
   varias veces durante el mismo render del servidor.
========================================================= */

export const getCurrentUser = cache(
  async () => {
    const supabase =
      await createClient();

    const {
      data: { user },
      error,
    } =
      await supabase.auth.getUser();

    if (error) {
      /*
       * Si Auth devuelve un error temporal,
       * no tumbamos todo el Home.
       */
      console.error(
        "No se pudo obtener el usuario actual:",
        error.message
      );

      return null;
    }

    return user ?? null;
  }
);