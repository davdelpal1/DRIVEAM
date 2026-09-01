import { apiFetch, apiMutate } from "@/lib/api";

import type { Preference, PreferenceUpdate } from "./types";

/** Preferencias del usuario autenticado (se autocrean con valores por defecto). */
export function getPreferences(): Promise<Preference> {
  return apiFetch<Preference>("/preferences/", { cache: "no-store" });
}

export function updatePreferences(
  patch: PreferenceUpdate,
): Promise<Preference> {
  return apiMutate<Preference>("/preferences/", "PATCH", patch);
}
