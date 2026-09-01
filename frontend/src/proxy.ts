import { NextResponse, type NextRequest } from "next/server";

/**
 * Comprobación optimista: si no hay cookie de sesión, redirige a /entrar antes de renderizar
 * una página privada (evita el parpadeo). La seguridad real la hace cada página server-side
 * con `getCurrentUser()`.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("sessionid")) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/perfil", "/perfil/:path*", "/candidatos", "/candidatos/:path*"],
};
