import { apiFetch, type Paginated } from "@/lib/api";

import type { Listing, Vehicle } from "./types";

/** Primera página de vehículos normalizados, ordenados por marca y modelo. */
export function getVehicles(): Promise<Paginated<Vehicle>> {
  return apiFetch<Paginated<Vehicle>>("/vehicles/", { cache: "no-store" });
}

/** Primera página de anuncios, con su vehículo y su fuente ya anidados. */
export function getListings(): Promise<Paginated<Listing>> {
  return apiFetch<Paginated<Listing>>("/listings/", { cache: "no-store" });
}
