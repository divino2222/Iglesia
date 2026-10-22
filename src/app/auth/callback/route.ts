import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") || "/mi-cuenta";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      /*
       * Solo se permite regresar a una página de esta misma app.
       * Evita redirecciones a sitios externos como "//otro-sitio.com".
       */
      const nextUrl = new URL(requestedNext, requestUrl.origin);
      const safeNext =
        nextUrl.origin === requestUrl.origin
          ? `${nextUrl.pathname}${nextUrl.search}`
          : "/mi-cuenta";

      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=No+pudimos+confirmar+tu+cuenta", requestUrl.origin)
  );
}