/**
 * Candidatos: coches dados de alta a mano (FASE 3).
 *
 * Vista plana del backend (`backend/apps/listings/api.py::CandidateSerializer`), que combina
 * campos de `Vehicle` (marca, modelo, versión, combustible, potencia, año) y de `Listing`
 * (precio, kilómetros, vendedor, garantía, ubicación, URL) más la nota del usuario. El
 * contrato completo es el esquema OpenAPI.
 */

import type { ScoreBreakdown } from "@/features/scoring/types";

export { FUEL_TYPE_OPTIONS } from "@/features/preferences/types";

/** Estados de seguimiento personal del candidato (`backend/apps/listings/enums.py::TrackingStatus`). */
export const TRACKING_STATUS_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: "nuevo", label: "Nuevo" },
  { value: "interesado", label: "Interesado" },
  { value: "contactado", label: "Contactado" },
  { value: "visita", label: "Visita" },
  { value: "descartado", label: "Descartado" },
  { value: "comprado", label: "Comprado" },
];

export const TRACKING_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  TRACKING_STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

export interface Candidate {
  id: number;
  vehicle_id: number;
  make: string;
  model: string;
  version: string;
  fuel_type: string;
  power_cv: number | null;
  year: number | null;
  /** Consumo medio en L/100 km (llega con la importación por URL, FASE 8). `null` si no hay dato. */
  fuel_consumption: string | null;
  mileage_km: number | null;
  price_cash: string | null;
  price_financed: string | null;
  seller_name: string;
  warranty_months: number | null;
  location: string;
  url: string;
  notes: string;
  tracking_status: string;
  source: string;
  source_label: string;
  score: number | null;
  /** Desglose del Car Score (FASE 7): explica el número. `null` si aún no se ha calculado. */
  score_breakdown: ScoreBreakdown | null;
  /** Coste total del coche pagándolo financiado (calculado, FASE 6). `null` sin oferta. */
  finance_total_cost: string | null;
  /** Diferencia de ese coste frente al precio al contado. `null` sin oferta o sin contado. */
  finance_difference_vs_cash: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
}

/** Payload de alta/edición: los campos editables del formulario "Nuevo candidato". */
export interface CandidateInput {
  make: string;
  model: string;
  version?: string;
  fuel_type?: string;
  power_cv?: number | null;
  year?: number | null;
  fuel_consumption?: string | null;
  mileage_km?: number | null;
  price_cash?: string | null;
  price_financed?: string | null;
  seller_name?: string;
  warranty_months?: number | null;
  location?: string;
  url?: string;
  notes?: string;
  /** URL de origen cuando el candidato viene de la importación (FASE 8): fija la fuente. */
  import_url?: string;
}
