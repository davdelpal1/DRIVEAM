import { describe, expect, it } from "vitest";

import {
  applyFilters,
  EMPTY_FILTERS,
  sortCandidates,
} from "./dashboard-filters";
import type { Candidate } from "./types";

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 1,
    vehicle_id: 1,
    make: "Seat",
    model: "León",
    version: "",
    fuel_type: "gasolina",
    power_cv: 150,
    year: 2020,
    mileage_km: 50000,
    price_cash: "18000.00",
    price_financed: null,
    seller_name: "",
    warranty_months: null,
    location: "",
    url: "",
    notes: "",
    tracking_status: "nuevo",
    source: "manual",
    source_label: "Entrada manual",
    score: null,
    is_favorite: false,
    is_archived: false,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("applyFilters", () => {
  it("oculta los archivados salvo que se pida verlos", () => {
    const list = [
      candidate({ id: 1 }),
      candidate({ id: 2, is_archived: true }),
    ];
    expect(applyFilters(list, EMPTY_FILTERS).map((c) => c.id)).toEqual([1]);
    expect(
      applyFilters(list, { ...EMPTY_FILTERS, showArchived: true }).map(
        (c) => c.id,
      ),
    ).toEqual([1, 2]);
  });

  it("filtra por favorito, estado, precio máximo y año mínimo", () => {
    const list = [
      candidate({
        id: 1,
        is_favorite: true,
        price_cash: "15000.00",
        year: 2019,
      }),
      candidate({
        id: 2,
        is_favorite: false,
        price_cash: "30000.00",
        year: 2023,
      }),
      candidate({
        id: 3,
        is_favorite: true,
        tracking_status: "visita",
        year: 2015,
      }),
    ];
    expect(
      applyFilters(list, { ...EMPTY_FILTERS, onlyFavorites: true }).map(
        (c) => c.id,
      ),
    ).toEqual([1, 3]);
    expect(
      applyFilters(list, { ...EMPTY_FILTERS, trackingStatus: "visita" }).map(
        (c) => c.id,
      ),
    ).toEqual([3]);
    expect(
      applyFilters(list, { ...EMPTY_FILTERS, priceMax: "20000" }).map(
        (c) => c.id,
      ),
    ).toEqual([1, 3]);
    expect(
      applyFilters(list, { ...EMPTY_FILTERS, yearMin: "2018" }).map(
        (c) => c.id,
      ),
    ).toEqual([1, 2]);
  });

  it("descarta los que no tienen dato cuando el filtro numérico está activo", () => {
    const list = [candidate({ id: 1, price_cash: null })];
    expect(applyFilters(list, { ...EMPTY_FILTERS, priceMax: "20000" })).toEqual(
      [],
    );
  });
});

describe("sortCandidates", () => {
  it("ordena por precio ascendente con los nulos al final", () => {
    const list = [
      candidate({ id: 1, price_cash: "20000.00" }),
      candidate({ id: 2, price_cash: null }),
      candidate({ id: 3, price_cash: "10000.00" }),
    ];
    expect(sortCandidates(list, "price_asc").map((c) => c.id)).toEqual([
      3, 1, 2,
    ]);
  });

  it("ordena por año descendente", () => {
    const list = [
      candidate({ id: 1, year: 2018 }),
      candidate({ id: 2, year: 2022 }),
    ];
    expect(sortCandidates(list, "year_desc").map((c) => c.id)).toEqual([2, 1]);
  });
});
