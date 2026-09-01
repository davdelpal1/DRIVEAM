/**
 * Tipos del catálogo de dominio (FASE 1).
 *
 * Solo se declaran los campos que consume la interfaz; el contrato completo es el esquema
 * OpenAPI de la API (`/api/v1/schema/`).
 */

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  version: string;
  display_name: string;
  fuel_type: string;
  transmission: string;
  first_registration_year: number | null;
}

export interface Source {
  id: number;
  name: string;
  slug: string;
}

/** Importes: la API los transporta como cadena decimal (`"10500.00"`) o `null` si se desconocen. */
export interface Listing {
  id: number;
  url: string;
  title: string;
  status: string;
  price_cash: string | null;
  price_financed: string | null;
  mileage_km: number | null;
  province: string;
  vehicle: number;
  vehicle_detail: Vehicle;
  source_detail: Source;
}
