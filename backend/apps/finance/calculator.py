"""Calculadora determinista del coste real de financiar un anuncio (FASE 6).

A partir de las condiciones **tal y como se anuncian** (entrada, cuota, número de cuotas,
cuota final, comisión de apertura, productos, TIN/TAE) se obtiene el coste total del coche
pagándolo financiado y su diferencia frente al pago al contado.

Principios (CLAUDE.md):

- Todo importe es `Decimal`; no se redondea en pasos intermedios, solo al final
  (`ROUND_HALF_UP`, 2 decimales).
- La ausencia de un dato **nunca** se convierte en `0` en los importes principales: si falta
  un insumo de una métrica, esa métrica es `None`.
- Excepción documentada: la comisión de apertura, los productos y la entrada ausentes se
  tratan como `0` (no hay coste conocido por ese concepto); el cuadro de cuotas
  (`monthly_payment` + `number_of_payments`) sí es obligatorio.
- Método V1 = "valores anunciados": el total de cuotas es `cuota * nº` más la cuota final.
  **No** se recalcula la cuota a partir del TIN; esa comprobación se deja para una versión
  futura (ver `docs/decisions/0011`).
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

CENTS = Decimal("0.01")
_MONTHS_PER_YEAR = Decimal("12")


@dataclass(frozen=True)
class FinanceBreakdown:
    """Resultado del cálculo. Cada métrica es `None` si le falta algún insumo."""

    amount_financed: Decimal | None
    total_payments: Decimal | None
    total_financed_cost: Decimal | None
    difference_vs_cash: Decimal | None
    annual_cost_approx: Decimal | None


def _q(value: Decimal | None) -> Decimal | None:
    if value is None:
        return None
    return value.quantize(CENTS, rounding=ROUND_HALF_UP)


def compute_breakdown(
    *,
    price_cash: Decimal | None = None,
    deposit: Decimal | None = None,
    amount_financed: Decimal | None = None,
    monthly_payment: Decimal | None = None,
    number_of_payments: int | None = None,
    final_payment: Decimal | None = None,
    opening_fee: Decimal | None = None,
    mandatory_products_cost: Decimal | None = None,
    tin: Decimal | None = None,
    tae: Decimal | None = None,
) -> FinanceBreakdown:
    del tin, tae  # reservados para la comprobación de la cuota (V2); ver docs/decisions/0011
    fee = opening_fee or Decimal(0)
    products = mandatory_products_cost or Decimal(0)
    down = deposit or Decimal(0)

    # Importe financiado: el dado, o el derivado de contado - entrada.
    financed = amount_financed
    if financed is None and price_cash is not None and deposit is not None:
        financed = price_cash - deposit

    # Total de todo lo que se paga en cuotas (incluida la cuota final).
    total_payments: Decimal | None = None
    if monthly_payment is not None and number_of_payments is not None:
        total_payments = monthly_payment * number_of_payments + (final_payment or Decimal(0))

    total_financed_cost: Decimal | None = None
    difference_vs_cash: Decimal | None = None
    annual_cost_approx: Decimal | None = None

    if total_payments is not None:
        total_financed_cost = down + total_payments + fee + products

        if price_cash is not None:
            difference_vs_cash = total_financed_cost - price_cash

        if number_of_payments:
            years = Decimal(number_of_payments) / _MONTHS_PER_YEAR
            annual_cost_approx = total_financed_cost / years

    return FinanceBreakdown(
        amount_financed=_q(financed),
        total_payments=_q(total_payments),
        total_financed_cost=_q(total_financed_cost),
        difference_vs_cash=_q(difference_vs_cash),
        annual_cost_approx=_q(annual_cost_approx),
    )
