import "server-only";

import { cookies } from "next/headers";

const SERVER_BASE_URL =
  process.env.API_BASE_URL_INTERNAL ?? "http://backend:8000";

/**
 * GET a la API desde un Server Component, reenviando las cookies de sesión de la petición
 * entrante (los Server Components no comparten el `fetch` con credenciales del navegador).
 * Devuelve `null` si la respuesta no es OK (incluye 401) o si la petición falla.
 */
export async function serverApiGet<T>(path: string): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();

  try {
    const response = await fetch(`${SERVER_BASE_URL}/api/v1${path}`, {
      headers: { Accept: "application/json", Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
