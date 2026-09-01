/**
 * Conversión formulario ⇄ API para el alta de candidatos. Aislado para poder testearlo:
 * el formulario trabaja con cadenas (lo que devuelve un `<input>`) y la API espera números,
 * decimales como cadena y `null` para los datos ausentes (nunca `0` — ver CLAUDE.md).
 */

import type { Candidate, CandidateInput } from "./types";

export interface CandidateFormValues {
  make: string;
  model: string;
  version: string;
  fuel_type: string;
  power_cv: string;
  year: string;
  mileage_km: string;
  price_cash: string;
  price_financed: string;
  seller_name: string;
  warranty_months: string;
  location: string;
  url: string;
  notes: string;
}

export const EMPTY_CANDIDATE: CandidateFormValues = {
  make: "",
  model: "",
  version: "",
  fuel_type: "desconocido",
  power_cv: "",
  year: "",
  mileage_km: "",
  price_cash: "",
  price_financed: "",
  seller_name: "",
  warranty_months: "",
  location: "",
  url: "",
  notes: "",
};

export function fromCandidate(candidate: Candidate): CandidateFormValues {
  const text = (value: string | number | null): string =>
    value === null || value === undefined ? "" : String(value);
  return {
    make: candidate.make,
    model: candidate.model,
    version: candidate.version,
    fuel_type: candidate.fuel_type || "desconocido",
    power_cv: text(candidate.power_cv),
    year: text(candidate.year),
    mileage_km: text(candidate.mileage_km),
    price_cash: text(candidate.price_cash),
    price_financed: text(candidate.price_financed),
    seller_name: candidate.seller_name,
    warranty_months: text(candidate.warranty_months),
    location: candidate.location,
    url: candidate.url,
    notes: candidate.notes,
  };
}

/** `""` → `null` para números; deja la cadena tal cual para los decimales de precio. */
function intOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function decimalOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function toPayload(values: CandidateFormValues): CandidateInput {
  return {
    make: values.make.trim(),
    model: values.model.trim(),
    version: values.version.trim(),
    fuel_type: values.fuel_type,
    power_cv: intOrNull(values.power_cv),
    year: intOrNull(values.year),
    mileage_km: intOrNull(values.mileage_km),
    price_cash: decimalOrNull(values.price_cash),
    price_financed: decimalOrNull(values.price_financed),
    seller_name: values.seller_name.trim(),
    warranty_months: intOrNull(values.warranty_months),
    location: values.location.trim(),
    url: values.url.trim(),
    notes: values.notes.trim(),
  };
}
