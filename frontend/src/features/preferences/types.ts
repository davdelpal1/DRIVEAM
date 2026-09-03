/**
 * Preferencias de compra del usuario (FASE 2).
 *
 * Espejo parcial de `backend/apps/accounts/models.py::UserPreference` y
 * `backend/apps/vehicles/enums.py::FuelType`. El contrato completo es el esquema OpenAPI.
 */

export interface Preference {
  budget_target: string | null;
  budget_max: string | null;
  max_mileage: number | null;
  min_year: number | null;
  fuel_types: string[];
  body_types: string[];
  weight_price: number;
  weight_mileage: number;
  weight_age: number;
  weight_reliability: number;
  weight_consumption: number;
  weight_financing: number;
  weight_warranty: number;
}

/** Payload de actualización: cualquier subconjunto de campos editables. */
export type PreferenceUpdate = Partial<Preference>;

/** Valores de `FuelType` (el `value` es el contrato de la API; la etiqueta, para la interfaz). */
export const FUEL_TYPE_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "gasolina", label: "Gasolina" },
  { value: "diesel", label: "Diésel" },
  { value: "hibrido", label: "Híbrido" },
  { value: "hibrido_enchufable", label: "Híbrido enchufable" },
  { value: "electrico", label: "Eléctrico" },
  { value: "glp", label: "GLP (autogás)" },
  { value: "gnc", label: "GNC (gas natural)" },
];

export const WEIGHT_KEYS = [
  "weight_price",
  "weight_mileage",
  "weight_age",
  "weight_reliability",
  "weight_consumption",
  "weight_financing",
  "weight_warranty",
] as const;

export type WeightKey = (typeof WEIGHT_KEYS)[number];

export const WEIGHT_FIELDS: ReadonlyArray<{ key: WeightKey; label: string }> = [
  { key: "weight_price", label: "Precio" },
  { key: "weight_mileage", label: "Kilómetros" },
  { key: "weight_age", label: "Antigüedad" },
  { key: "weight_reliability", label: "Fiabilidad" },
  { key: "weight_consumption", label: "Consumo" },
  { key: "weight_financing", label: "Financiación" },
  { key: "weight_warranty", label: "Garantía" },
];
