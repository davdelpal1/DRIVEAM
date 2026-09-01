/**
 * Conversión entre las preferencias de la API y el estado del formulario.
 *
 * Se aísla de la interfaz para poder probar la serialización: la API espera importes como
 * cadena decimal (`"12000.00"`) o `null`, enteros para año/kilómetros y `0` para un peso vacío.
 */

import type { Preference, PreferenceUpdate, WeightKey } from "./types";
import { WEIGHT_FIELDS } from "./types";

export interface PreferenceFormValues {
  budget_target: string;
  budget_max: string;
  min_year: string;
  max_mileage: string;
  fuel_types: string[];
  /** Carrocerías separadas por comas. */
  body_types: string;
  weights: Record<WeightKey, string>;
}

export function fromPreference(preference: Preference): PreferenceFormValues {
  return {
    budget_target: preference.budget_target ?? "",
    budget_max: preference.budget_max ?? "",
    min_year: preference.min_year?.toString() ?? "",
    max_mileage: preference.max_mileage?.toString() ?? "",
    fuel_types: [...preference.fuel_types],
    body_types: preference.body_types.join(", "),
    weights: Object.fromEntries(
      WEIGHT_FIELDS.map(({ key }) => [key, String(preference[key] ?? 0)]),
    ) as Record<WeightKey, string>,
  };
}

function toDecimalOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toIntegerOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export function toPayload(values: PreferenceFormValues): PreferenceUpdate {
  const weights = Object.fromEntries(
    WEIGHT_FIELDS.map(({ key }) => {
      const parsed = Number(values.weights[key]);
      return [key, Number.isFinite(parsed) ? Math.trunc(parsed) : 0];
    }),
  ) as Record<WeightKey, number>;

  return {
    budget_target: toDecimalOrNull(values.budget_target),
    budget_max: toDecimalOrNull(values.budget_max),
    min_year: toIntegerOrNull(values.min_year),
    max_mileage: toIntegerOrNull(values.max_mileage),
    fuel_types: values.fuel_types,
    body_types: values.body_types
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
    ...weights,
  };
}
