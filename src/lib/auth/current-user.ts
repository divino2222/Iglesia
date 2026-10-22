import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/* =========================================================
   USUARIO AUTENTICADO COMPARTIDO

   cache() evita repetir auth.getUser()
   varias veces durante el mismo render del servidor.

   IMPORTANTE:
   No tener una sesión iniciada NO es un error.

   Un visitante puede navegar públicamente por Comunidad VID
   sin haber creado una cuenta todavía.
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

    /* =====================================================
       SIN SESIÓN

       Supabase puede devolver AuthSessionMissingError
       cuando el navegador no tiene una sesión.

       Eso es completamente normal para:
       - visitantes
       - navegación incógnita
       - personas nuevas
       - usuarios que cerraron sesión
    ===================================================== */

    if (error) {
      const isMissingSession =
        error.name ===
          "AuthSessionMissingError" ||
        error.message
          .toLowerCase()
          .includes(
            "auth session missing"
          );

      if (isMissingSession) {
        return null;
      }

      /* ===================================================
         ERROR REAL DE AUTENTICACIÓN

         Si ocurre algo distinto a "no hay sesión",
         sí lo registramos para poder diagnosticarlo,
         pero tampoco tumbamos toda la página pública.
      =================================================== */

      console.error(
        "Error consultando el usuario actual:",
        error
      );

      return null;
    }

    /* =====================================================
       USUARIO AUTENTICADO
    ===================================================== */

    return user ?? null;
  }
);