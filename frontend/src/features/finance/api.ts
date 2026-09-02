import { apiMutate } from "@/lib/api";

import type { FinanceBreakdown, FinanceOffer } from "./types";

/** Calcula el desglose sin persistir nada (previsualización del formulario). */
export async function calculateFinance(
  terms: Record<string, string | number>,
): Promise<FinanceBreakdown> {
  const { breakdown } = await apiMutate<{ breakdown: FinanceBreakdown }>(
    "/finance/calculate/",
    "POST",
    terms,
  );
  return breakdown;
}

/** Guarda (crea o reemplaza) la oferta de financiación del candidato. */
export function saveCandidateFinance(
  candidateId: number,
  body: Record<string, string | number>,
): Promise<FinanceOffer> {
  return apiMutate<FinanceOffer>(
    `/candidates/${candidateId}/finance/`,
    "PUT",
    body,
  );
}

/** Elimina la oferta de financiación del candidato. */
export function deleteCandidateFinance(candidateId: number): Promise<void> {
  return apiMutate<void>(`/candidates/${candidateId}/finance/`, "DELETE");
}
