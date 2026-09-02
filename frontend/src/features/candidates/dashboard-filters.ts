/**
 * Filtrado y ordenación del dashboard "Mis coches" (FASE 4), en cliente.
 *
 * La página carga todos los candidatos del usuario (dataset personal pequeño); aquí se
 * filtran y ordenan sin recargar. Funciones puras para poder testearlas.
 */

import type { Candidate } from "./types";

export interface DashboardFilters {
  priceMax: string;
  yearMin: string;
  mileageMax: string;
  fuelType: string;
  trackingStatus: string;
  onlyFavorites: boolean;
  showArchived: boolean;
}

export const EMPTY_FILTERS: DashboardFilters = {
  priceMax: "",
  yearMin: "",
  mileageMax: "",
  fuelType: "",
  trackingStatus: "",
  onlyFavorites: false,
  showArchived: false,
};

export type SortKey =
  "created_desc" | "price_asc" | "score_desc" | "mileage_asc" | "year_desc";

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "created_desc", label: "Fecha añadido (recientes)" },
  { value: "price_asc", label: "Precio (menor primero)" },
  { value: "score_desc", label: "Score (mayor primero)" },
  { value: "mileage_asc", label: "Kilómetros (menos primero)" },
  { value: "year_desc", label: "Año (más nuevo primero)" },
];

function num(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function applyFilters(
  candidates: Candidate[],
  filters: DashboardFilters,
): Candidate[] {
  const priceMax = num(filters.priceMax);
  const yearMin = num(filters.yearMin);
  const mileageMax = num(filters.mileageMax);

  return candidates.filter((c) => {
    if (!filters.showArchived && c.is_archived) return false;
    if (filters.onlyFavorites && !c.is_favorite) return false;
    if (filters.trackingStatus && c.tracking_status !== filters.trackingStatus)
      return false;
    if (filters.fuelType && c.fuel_type !== filters.fuelType) return false;
    if (
      priceMax !== null &&
      (c.price_cash === null || Number(c.price_cash) > priceMax)
    )
      return false;
    if (yearMin !== null && (c.year === null || c.year < yearMin)) return false;
    if (
      mileageMax !== null &&
      (c.mileage_km === null || c.mileage_km > mileageMax)
    )
      return false;
    return true;
  });
}

/** Compara dos valores llevando los `null` siempre al final. */
function compareNullable(
  a: number | null,
  b: number | null,
  direction: 1 | -1,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * direction;
}

export function sortCandidates(
  candidates: Candidate[],
  sort: SortKey,
): Candidate[] {
  const copy = [...candidates];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) =>
        compareNullable(
          a.price_cash === null ? null : Number(a.price_cash),
          b.price_cash === null ? null : Number(b.price_cash),
          1,
        ),
      );
    case "score_desc":
      return copy.sort((a, b) => compareNullable(a.score, b.score, -1));
    case "mileage_asc":
      return copy.sort((a, b) =>
        compareNullable(a.mileage_km, b.mileage_km, 1),
      );
    case "year_desc":
      return copy.sort((a, b) => compareNullable(a.year, b.year, -1));
    case "created_desc":
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }
}
