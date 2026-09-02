/**
 * Calculadora de financiación (FASE 6).
 *
 * El cálculo es del backend (`backend/apps/finance/calculator.py`): aquí solo se envían las
 * condiciones y se pinta el desglose que devuelve. Términos en español: TIN, TAE, cuota,
 * entrada, cuota final, comisión de apertura, productos.
 */

/** Métricas calculadas. Cada una es `null` si le falta algún dato de entrada. */
export interface FinanceBreakdown {
  amount_financed: string | null;
  total_payments: string | null;
  total_financed_cost: string | null;
  difference_vs_cash: string | null;
  annual_cost_approx: string | null;
}

/** Condiciones de la oferta tal y como las guarda el backend (`FinanceOffer`). */
export interface FinanceOffer {
  id: number;
  listing: number;
  deposit: string | null;
  amount_financed: string | null;
  monthly_payment: string | null;
  number_of_payments: number | null;
  final_payment: string | null;
  opening_fee: string | null;
  tin: string | null;
  tae: string | null;
  mandatory_products_cost: string | null;
  total_cost: string | null;
  source_text: string;
  breakdown: FinanceBreakdown;
  created_at: string;
  updated_at: string;
}

/** Campos editables del formulario. Cadenas vacías = "sin dato" (se omiten al enviar). */
export interface FinanceFormValues {
  price_cash: string;
  deposit: string;
  amount_financed: string;
  monthly_payment: string;
  number_of_payments: string;
  final_payment: string;
  opening_fee: string;
  tin: string;
  tae: string;
  mandatory_products_cost: string;
  source_text: string;
}

/** Etiqueta de cada métrica del desglose y el dato que necesita si falta. */
export const BREAKDOWN_LABELS: Record<
  keyof FinanceBreakdown,
  { label: string; needs: string }
> = {
  amount_financed: {
    label: "Importe financiado",
    needs: "importe financiado, o precio al contado y entrada",
  },
  total_payments: {
    label: "Total en cuotas",
    needs: "cuota y número de cuotas",
  },
  total_financed_cost: {
    label: "Coste total financiado",
    needs: "cuota y número de cuotas",
  },
  difference_vs_cash: {
    label: "Diferencia frente al contado",
    needs: "precio al contado y el cuadro de cuotas",
  },
  annual_cost_approx: {
    label: "Coste anual aproximado",
    needs: "número de cuotas",
  },
};
