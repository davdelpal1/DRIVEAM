import { ApiError } from "@/lib/api";

import type { FieldErrors } from "./types";

/** Normaliza el cuerpo de error de DRF a `{ campo: ["mensaje", …] }`. */
export function toFieldErrors(error: unknown): FieldErrors {
  if (
    error instanceof ApiError &&
    error.data &&
    typeof error.data === "object" &&
    !Array.isArray(error.data)
  ) {
    const result: FieldErrors = {};
    for (const [key, value] of Object.entries(
      error.data as Record<string, unknown>,
    )) {
      if (Array.isArray(value)) {
        result[key] = value.map((item) => String(item));
      } else if (typeof value === "string") {
        result[key] = value;
      }
    }
    if (Object.keys(result).length > 0) return result;
  }
  return { detail: "No se pudo completar la operación. Inténtalo de nuevo." };
}

/** Primer mensaje de error para cualquiera de las claves dadas. */
export function firstError(
  errors: FieldErrors,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = errors[key];
    if (Array.isArray(value)) return value[0];
    if (typeof value === "string") return value;
  }
  return undefined;
}
