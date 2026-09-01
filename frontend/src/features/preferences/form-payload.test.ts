import { describe, expect, it } from "vitest";

import { fromPreference, toPayload } from "./form-payload";
import type { Preference } from "./types";

const BASE: Preference = {
  budget_target: "12000.00",
  budget_max: "15000.00",
  max_mileage: 120000,
  min_year: 2018,
  fuel_types: ["diesel", "hibrido"],
  body_types: ["familiar", "SUV"],
  weight_price: 40,
  weight_mileage: 20,
  weight_age: 15,
  weight_reliability: 15,
  weight_consumption: 5,
  weight_financing: 5,
};

describe("fromPreference / toPayload", () => {
  it("hace ida y vuelta sin perder información", () => {
    expect(toPayload(fromPreference(BASE))).toEqual({
      budget_target: "12000.00",
      budget_max: "15000.00",
      min_year: 2018,
      max_mileage: 120000,
      fuel_types: ["diesel", "hibrido"],
      body_types: ["familiar", "SUV"],
      weight_price: 40,
      weight_mileage: 20,
      weight_age: 15,
      weight_reliability: 15,
      weight_consumption: 5,
      weight_financing: 5,
    });
  });

  it("convierte los campos vacíos en null (no en 0)", () => {
    const empty: Preference = {
      ...BASE,
      budget_target: null,
      budget_max: null,
      max_mileage: null,
      min_year: null,
      fuel_types: [],
      body_types: [],
    };
    const payload = toPayload(fromPreference(empty));

    expect(payload.budget_target).toBeNull();
    expect(payload.budget_max).toBeNull();
    expect(payload.min_year).toBeNull();
    expect(payload.max_mileage).toBeNull();
    expect(payload.fuel_types).toEqual([]);
    expect(payload.body_types).toEqual([]);
  });

  it("separa las carrocerías por comas y descarta las vacías", () => {
    const values = fromPreference(BASE);
    values.body_types = " familiar ,, SUV ,  ";

    expect(toPayload(values).body_types).toEqual(["familiar", "SUV"]);
  });

  it("un peso vacío se envía como 0", () => {
    const values = fromPreference(BASE);
    values.weights.weight_consumption = "";

    expect(toPayload(values).weight_consumption).toBe(0);
  });
});
