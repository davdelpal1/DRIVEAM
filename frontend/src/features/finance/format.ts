import type { FinanceFormValues, FinanceOffer } from "./types";

const eurFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

/** Formatea un importe (string decimal del backend) en euros, o `—` si es `null`. */
export function eur(value: string | null): string {
  return value === null ? "—" : eurFormatter.format(Number(value));
}

export const EMPTY_FINANCE: FinanceFormValues = {
  price_cash: "",
  deposit: "",
  amount_financed: "",
  monthly_payment: "",
  number_of_payments: "",
  final_payment: "",
  opening_fee: "",
  tin: "",
  tae: "",
  mandatory_products_cost: "",
  source_text: "",
};

const DECIMAL_FIELDS = [
  "price_cash",
  "deposit",
  "amount_financed",
  "monthly_payment",
  "final_payment",
  "opening_fee",
  "tin",
  "tae",
  "mandatory_products_cost",
] as const;

function str(value: string | number | null): string {
  return value === null ? "" : String(value);
}

/** Rellena el formulario con una oferta guardada + el precio al contado del anuncio. */
export function fromOffer(
  offer: FinanceOffer | null,
  priceCash: string | null,
): FinanceFormValues {
  if (!offer) return { ...EMPTY_FINANCE, price_cash: str(priceCash) };
  return {
    price_cash: str(priceCash),
    deposit: str(offer.deposit),
    amount_financed: str(offer.amount_financed),
    monthly_payment: str(offer.monthly_payment),
    number_of_payments: str(offer.number_of_payments),
    final_payment: str(offer.final_payment),
    opening_fee: str(offer.opening_fee),
    tin: str(offer.tin),
    tae: str(offer.tae),
    mandatory_products_cost: str(offer.mandatory_products_cost),
    source_text: offer.source_text,
  };
}

/**
 * Convierte el formulario al cuerpo de la petición: los campos vacíos se omiten (nunca se
 * mandan como `0`), los decimales como cadena y `number_of_payments` como entero.
 */
export function toTerms(
  values: FinanceFormValues,
): Record<string, string | number> {
  const body: Record<string, string | number> = {};
  for (const key of DECIMAL_FIELDS) {
    const raw = values[key].trim();
    if (raw !== "") body[key] = raw;
  }
  const months = values.number_of_payments.trim();
  if (months !== "") body.number_of_payments = Number(months);
  return body;
}

/**
 * Cuerpo del PUT que persiste la oferta: como `toTerms` pero sin `price_cash` (es del
 * anuncio, no de la oferta) y con el texto libre.
 */
export function toOfferBody(
  values: FinanceFormValues,
): Record<string, string | number> {
  const body = toTerms(values);
  delete body.price_cash;
  const text = values.source_text.trim();
  if (text !== "") body.source_text = text;
  return body;
}
