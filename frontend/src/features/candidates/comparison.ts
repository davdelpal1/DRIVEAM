/**
 * Comparador de candidatos (FASE 5), en cliente.
 *
 * La página carga todos los candidatos del usuario (igual que el dashboard, ver
 * `dashboard-filters.ts`) y aquí se seleccionan entre 2 y 5 para verlos lado a lado. Las
 * filas de comparación y el cálculo de "quién gana en cada criterio" son puros y testeables;
 * la presentación vive en `comparison-table.tsx`.
 *
 * `consumo` queda fuera: el modelo `Vehicle` todavía no tiene ese dato (llegará con la
 * importación por URL de la FASE 8).
 */

import {
  FUEL_TYPE_OPTIONS,
  TRACKING_STATUS_LABEL,
  type Candidate,
} from "./types";

export const MIN_COMPARE = 2;
export const MAX_COMPARE = 5;

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const decimal = new Intl.NumberFormat("es-ES");

const FUEL_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  FUEL_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

function money(value: string | null): string {
  return value === null ? "—" : eur.format(Number(value));
}

export interface ComparisonRow {
  key: string;
  label: string;
  /** Hacia dónde está "lo mejor"; `null` = fila informativa sin indicador. */
  best: "min" | "max" | null;
  /** Etiqueta corta del indicador cuando la fila tiene uno. */
  badge: string | null;
  /** Valor numérico comparable, o `null` si el candidato no lo tiene. */
  value: (candidate: Candidate) => number | null;
  /** Texto que se muestra en la celda. */
  format: (candidate: Candidate) => string;
}

export const COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    key: "price_cash",
    label: "Precio al contado",
    best: "min",
    badge: "Menor precio",
    value: (c) => (c.price_cash === null ? null : Number(c.price_cash)),
    format: (c) => money(c.price_cash),
  },
  {
    key: "price_financed",
    label: "Precio financiado",
    best: "min",
    badge: "Menor precio financiado",
    value: (c) => (c.price_financed === null ? null : Number(c.price_financed)),
    format: (c) => money(c.price_financed),
  },
  {
    key: "finance_total_cost",
    label: "Coste total financiado",
    best: "min",
    badge: "Menor coste total",
    value: (c) =>
      c.finance_total_cost === null ? null : Number(c.finance_total_cost),
    format: (c) => money(c.finance_total_cost),
  },
  {
    key: "year",
    label: "Año",
    best: "max",
    badge: "Más nuevo",
    value: (c) => c.year,
    format: (c) => (c.year === null ? "—" : String(c.year)),
  },
  {
    key: "mileage_km",
    label: "Kilómetros",
    best: "min",
    badge: "Menos km",
    value: (c) => c.mileage_km,
    format: (c) =>
      c.mileage_km === null ? "—" : `${decimal.format(c.mileage_km)} km`,
  },
  {
    key: "power_cv",
    label: "Potencia",
    best: "max",
    badge: "Más potencia",
    value: (c) => c.power_cv,
    format: (c) => (c.power_cv === null ? "—" : `${c.power_cv} CV`),
  },
  {
    key: "warranty_months",
    label: "Garantía",
    best: "max",
    badge: "Más garantía",
    value: (c) => c.warranty_months,
    format: (c) =>
      c.warranty_months === null ? "—" : `${c.warranty_months} meses`,
  },
  {
    key: "score",
    label: "Car Score",
    best: "max",
    badge: "Mejor score",
    value: (c) => c.score,
    format: (c) => (c.score === null ? "—" : String(c.score)),
  },
  {
    key: "fuel_type",
    label: "Combustible",
    best: null,
    badge: null,
    value: () => null,
    format: (c) =>
      c.fuel_type === "desconocido"
        ? "—"
        : (FUEL_TYPE_LABEL[c.fuel_type] ?? c.fuel_type),
  },
  {
    key: "seller_name",
    label: "Vendedor",
    best: null,
    badge: null,
    value: () => null,
    format: (c) => c.seller_name || "—",
  },
  {
    key: "location",
    label: "Ubicación",
    best: null,
    badge: null,
    value: () => null,
    format: (c) => c.location || "—",
  },
  {
    key: "tracking_status",
    label: "Estado",
    best: null,
    badge: null,
    value: () => null,
    format: (c) =>
      TRACKING_STATUS_LABEL[c.tracking_status] ?? c.tracking_status,
  },
];

/**
 * IDs de los candidatos que empatan en el mejor valor de la fila. Vacío si la fila es
 * informativa, si hay menos de dos candidatos con dato o si todos tienen el mismo valor
 * (entonces no hay nada que destacar).
 */
export function bestIds(
  candidates: Candidate[],
  row: ComparisonRow,
): Set<number> {
  if (row.best === null) return new Set();

  const pairs: Array<{ id: number; v: number }> = [];
  for (const candidate of candidates) {
    const v = row.value(candidate);
    if (v !== null) pairs.push({ id: candidate.id, v });
  }
  if (pairs.length < 2) return new Set();

  const values = pairs.map((p) => p.v);
  if (new Set(values).size === 1) return new Set();

  const target = row.best === "min" ? Math.min(...values) : Math.max(...values);
  return new Set(pairs.filter((p) => p.v === target).map((p) => p.id));
}

/** Parsea el parámetro `ids` de la URL (`?ids=1,2,3`) a enteros positivos sin duplicados. */
export function parseCompareIds(raw: string | undefined | null): number[] {
  if (!raw) return [];
  const seen = new Set<number>();
  for (const part of raw.split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n > 0) seen.add(n);
  }
  return [...seen];
}
