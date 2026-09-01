import { apiFetch, apiMutate } from "@/lib/api";

import type { Credentials, RegisterInput, User } from "./types";

/** Pide la cookie CSRF antes de la primera petición de escritura. */
export function ensureCsrfCookie(): Promise<unknown> {
  return apiFetch<unknown>("/auth/csrf/", { cache: "no-store" });
}

/** Usuario autenticado, o `null` si la sesión no es válida. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return await apiFetch<User>("/auth/me/", { cache: "no-store" });
  } catch {
    return null;
  }
}

export function registerRequest(input: RegisterInput): Promise<User> {
  return apiMutate<User>("/auth/register/", "POST", input);
}

export function loginRequest(credentials: Credentials): Promise<User> {
  return apiMutate<User>("/auth/login/", "POST", credentials);
}

export function logoutRequest(): Promise<void> {
  return apiMutate<void>("/auth/logout/", "POST");
}
