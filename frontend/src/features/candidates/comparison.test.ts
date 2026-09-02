import { describe, expect, it } from "vitest";

import { bestIds, COMPARISON_ROWS, parseCompareIds } from "./comparison";
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
    finance_total_cost: null,
    finance_difference_vs_cash: null,
    is_favorite: false,
    is_archived: false,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const row = (key: string) => {
  const found = COMPARISON_ROWS.find((r) => r.key === key);
  if (!found) throw new Error(`fila desconocida: ${key}`);
  return found;
};

describe("bestIds", () => {
  it("marca el precio más bajo", () => {
    const cs = [
      candidate({ id: 1, price_cash: "20000.00" }),
      candidate({ id: 2, price_cash: "15000.00" }),
      candidate({ id: 3, price_cash: "18000.00" }),
    ];
    expect([...bestIds(cs, row("price_cash"))]).toEqual([2]);
  });

  it("marca el año más alto y admite empates", () => {
    const cs = [
      candidate({ id: 1, year: 2019 }),
      candidate({ id: 2, year: 2022 }),
      candidate({ id: 3, year: 2022 }),
    ];
    expect(bestIds(cs, row("year"))).toEqual(new Set([2, 3]));
  });

  it("no destaca nada si todos tienen el mismo valor", () => {
    const cs = [
      candidate({ id: 1, mileage_km: 40000 }),
      candidate({ id: 2, mileage_km: 40000 }),
    ];
    expect(bestIds(cs, row("mileage_km")).size).toBe(0);
  });

  it("ignora los candidatos sin dato y no compara con menos de dos", () => {
    const cs = [
      candidate({ id: 1, score: 80 }),
      candidate({ id: 2, score: null }),
    ];
    expect(bestIds(cs, row("score")).size).toBe(0);
  });

  it("marca el menor coste total financiado e ignora candidatos sin oferta", () => {
    const cs = [
      candidate({ id: 1, finance_total_cost: "19000.00" }),
      candidate({ id: 2, finance_total_cost: "17500.00" }),
      candidate({ id: 3, finance_total_cost: null }),
    ];
    expect([...bestIds(cs, row("finance_total_cost"))]).toEqual([2]);
  });

  it("no devuelve nada para filas informativas", () => {
    const cs = [candidate({ id: 1 }), candidate({ id: 2 })];
    expect(bestIds(cs, row("seller_name")).size).toBe(0);
  });
});

describe("parseCompareIds", () => {
  it("parsea enteros positivos sin duplicados", () => {
    expect(parseCompareIds("3,1,2,1")).toEqual([3, 1, 2]);
  });

  it("descarta valores no válidos", () => {
    expect(parseCompareIds("1,abc,-2,0,4")).toEqual([1, 4]);
  });

  it("devuelve vacío sin parámetro", () => {
    expect(parseCompareIds(undefined)).toEqual([]);
    expect(parseCompareIds("")).toEqual([]);
  });
});
