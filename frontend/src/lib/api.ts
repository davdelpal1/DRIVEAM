/**
 * Cliente HTTP mínimo para la API de DRIVEAM.
 *
 * La URL base cambia según dónde se ejecute el código:
 * - en el servidor (Server Components) se usa la URL interna de la red de Docker;
 * - en el navegador se usa la URL pública.
 *
 * La autenticación es por cookie de sesión de Django: las peticiones van con
 * `credentials: "include"` y las de escritura añaden la cabecera `X-CSRFToken`.
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
  /** Cuerpo de la respuesta de error ya parseado (errores por campo de DRF, `detail`, …). */
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/** Lee el token CSRF de la cookie `csrftoken` (solo en el navegador). */
export function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function parseError(
  response: Response,
  context: string,
): Promise<ApiError> {
  const data = await response.json().catch(() => null);
  return new ApiError(
    `La API respondió ${response.status} al ${context}`,
    response.status,
    data,
  );
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}/api/v1${path}`, {
    credentials: "include",
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });

  if (!response.ok) {
    throw await parseError(response, `pedir ${path}`);
  }

  return (await response.json()) as T;
}

type MutationMethod = "POST" | "PUT" | "PATCH" | "DELETE";

/** Petición de escritura con cookie de sesión y token CSRF. Solo tiene sentido en el navegador. */
export async function apiMutate<T>(
  path: string,
  method: MutationMethod,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const csrfToken = readCsrfToken();
  if (csrfToken) headers["X-CSRFToken"] = csrfToken;

  const response = await fetch(`${apiBaseUrl()}/api/v1${path}`, {
    method,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await parseError(response, `${method} ${path}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
