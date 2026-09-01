/**
 * Candidatos: coches dados de alta a mano (FASE 3).
 *
 * Vista plana del backend (`backend/apps/listings/api.py::CandidateSerializer`), que combina
 * campos de `Vehicle` (marca, modelo, versión, combustible, potencia, año) y de `Listing`
 * (precio, kilómetros, vendedor, garantía, ubicación, URL) más la nota del usuario. El
 * contrato completo es el esquema OpenAPI.
 */

export { FUEL_TYPE_OPTIONS } from "@/features/preferences/types";

export interface Candidate {
  id: number;
  vehicle_id: number;
  make: string;
  model: string;
  version: string;
  fuel_type: string;
  power_cv: number | null;
  year: number | null;
  mileage_km: number | null;
  price_cash: string | null;
  price_financed: string | null;
  seller_name: string;
  warranty_months: number | null;
  location: string;
  url: string;
  notes: string;
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
  mileage_km?: number | null;
  price_cash?: string | null;
  price_financed?: string | null;
  seller_name?: string;
  warranty_months?: number | null;
  location?: string;
  url?: string;
  notes?: string;
}
