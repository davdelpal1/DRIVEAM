import { describe, expect, it } from "vitest";

import { EMPTY_FINANCE, eur, fromOffer, toOfferBody, toTerms } from "./format";
import type { FinanceOffer } from "./types";

describe("eur", () => {
  it("formatea importes y devuelve — para null", () => {
    expect(eur("15300.00")).toMatch(/15\.300,00\s?€/);
    expect(eur(null)).toBe("—");
  });
});

describe("toTerms", () => {
  it("omite los campos vacíos (no los envía como 0)", () => {
    const body = toTerms({
      ...EMPTY_FINANCE,
      price_cash: "15000.00",
      monthly_payment: "200.00",
      number_of_payments: "60",
    });
    expect(body).toEqual({
      price_cash: "15000.00",
      monthly_payment: "200.00",
      number_of_payments: 60,
    });
  });

  it("recorta espacios y convierte el número de cuotas a entero", () => {
    const body = toTerms({ ...EMPTY_FINANCE, number_of_payments: " 48 " });
    expect(body).toEqual({ number_of_payments: 48 });
  });
});

describe("toOfferBody", () => {
  it("no incluye price_cash y añade el texto libre", () => {
    const body = toOfferBody({
      ...EMPTY_FINANCE,
      price_cash: "15000.00",
      deposit: "3000.00",
      source_text: "  189 €/mes  ",
    });
    expect(body).toEqual({ deposit: "3000.00", source_text: "189 €/mes" });
  });
});

describe("fromOffer", () => {
  const offer: FinanceOffer = {
    id: 1,
    listing: 7,
    deposit: "3000.00",
    amount_financed: null,
    monthly_payment: "200.00",
    number_of_payments: 60,
    final_payment: null,
    opening_fee: "300.00",
    tin: "6.950",
    tae: null,
    mandatory_products_cost: null,
    total_cost: null,
    source_text: "",
    breakdown: {
      amount_financed: null,
      total_payments: "12000.00",
      total_financed_cost: "15300.00",
      difference_vs_cash: "300.00",
      annual_cost_approx: "3060.00",
    },
    created_at: "2026-09-02T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z",
  };

  it("vuelca la oferta y el precio al contado del anuncio", () => {
    const values = fromOffer(offer, "15000.00");
    expect(values.price_cash).toBe("15000.00");
    expect(values.deposit).toBe("3000.00");
    expect(values.number_of_payments).toBe("60");
    expect(values.amount_financed).toBe("");
  });

  it("sin oferta deja todo vacío salvo el precio al contado", () => {
    expect(fromOffer(null, "15000.00")).toEqual({
      ...EMPTY_FINANCE,
      price_cash: "15000.00",
    });
  });
});
