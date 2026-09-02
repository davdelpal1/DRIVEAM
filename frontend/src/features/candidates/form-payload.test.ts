import { describe, expect, it } from "vitest";

import { EMPTY_CANDIDATE, fromCandidate, toPayload } from "./form-payload";
import type { Candidate } from "./types";

const BASE: Candidate = {
  id: 1,
  vehicle_id: 2,
  make: "Seat",
  model: "León",
  version: "1.5 TSI FR",
  fuel_type: "gasolina",
  power_cv: 150,
  year: 2021,
  mileage_km: 42000,
  price_cash: "18500.00",
  price_financed: null,
  seller_name: "Concesionario Norte",
  warranty_months: 12,
  location: "Sevilla",
  url: "https://ejemplo.test/1",
  notes: "Único dueño.",
  tracking_status: "nuevo",
  source: "manual",
  source_label: "Entrada manual",
  score: null,
  is_favorite: false,
  is_archived: false,
  created_at: "2026-09-01T00:00:00Z",
};

describe("fromCandidate / toPayload", () => {
  it("hace ida y vuelta conservando los datos", () => {
    expect(toPayload(fromCandidate(BASE))).toEqual({
      make: "Seat",
      model: "León",
      version: "1.5 TSI FR",
      fuel_type: "gasolina",
      power_cv: 150,
      year: 2021,
      mileage_km: 42000,
      price_cash: "18500.00",
      price_financed: null,
      seller_name: "Concesionario Norte",
      warranty_months: 12,
      location: "Sevilla",
      url: "https://ejemplo.test/1",
      notes: "Único dueño.",
    });
  });

  it("convierte los campos numéricos vacíos en null, nunca en 0", () => {
    const payload = toPayload(EMPTY_CANDIDATE);

    expect(payload.power_cv).toBeNull();
    expect(payload.year).toBeNull();
    expect(payload.mileage_km).toBeNull();
    expect(payload.price_cash).toBeNull();
    expect(payload.price_financed).toBeNull();
    expect(payload.warranty_months).toBeNull();
  });

  it("mantiene el precio como cadena decimal", () => {
    const values = { ...EMPTY_CANDIDATE, price_cash: " 12000.50 " };
    expect(toPayload(values).price_cash).toBe("12000.50");
  });
});
