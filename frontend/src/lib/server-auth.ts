import "server-only";

import { cache } from "react";

import type { User } from "@/features/auth/types";

import { serverApiGet } from "./server-api";

/**
 * Usuario autenticado según la cookie de sesión de la petición entrante, o `null`.
 * Es el guard real de las páginas privadas (el `proxy.ts` solo hace una comprobación optimista).
 * `cache()` deduplica la llamada dentro de un mismo render (layout + página).
 */
export const getCurrentUser = cache((): Promise<User | null> =>
  serverApiGet<User>("/auth/me/"),
);
