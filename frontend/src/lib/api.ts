/**
 * Cliente HTTP mínimo para la API de DRIVEAM.
 *
 * La URL base cambia según dónde se ejecute el código:
 * - en el servidor (Server Components) se usa la URL interna de la red de Docker;
 * - en el navegador se usa la URL pública.
 */

const SERVER_BASE_URL =
  process.env.API_BASE_URL_INTERNAL ?? "http://backend:8000";
const CLIENT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function apiBaseUrl(): string {
  return typeof window === "undefined" ? SERVER_BASE_URL : CLIENT_BASE_URL;
}

/** Respuesta paginada estándar de Django REST Framework (`PageNumberPagination`). */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}/api/v1${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });

  if (!response.ok) {
    throw new ApiError(
      `La API respondió ${response.status} al pedir ${path}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}
