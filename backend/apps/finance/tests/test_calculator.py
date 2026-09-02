"""Tests deterministas de la calculadora de financiación (FASE 6, obligatorios).

Cifras exactas y comprobación de que la ausencia de datos produce `None`, nunca `0`.
"""

from decimal import Decimal

from apps.finance.calculator import compute_breakdown


def _d(value: str) -> Decimal:
    return Decimal(value)


def test_caso_completo_sin_cuota_final() -> None:
    bd = compute_breakdown(
        price_cash=_d("15000.00"),
        deposit=_d("3000.00"),
        monthly_payment=_d("200.00"),
        number_of_payments=60,
        opening_fee=_d("300.00"),
        mandatory_products_cost=_d("0.00"),
    )

    assert bd.amount_financed == _d("12000.00")
    assert bd.total_payments == _d("12000.00")
    assert bd.total_financed_cost == _d("15300.00")
    assert bd.difference_vs_cash == _d("300.00")
    assert bd.annual_cost_approx == _d("3060.00")


def test_caso_con_cuota_final_balloon() -> None:
    bd = compute_breakdown(
        price_cash=_d("22000.00"),
        deposit=_d("2000.00"),
        monthly_payment=_d("150.00"),
        number_of_payments=48,
        final_payment=_d("12000.00"),
        opening_fee=_d("400.00"),
        mandatory_products_cost=_d("500.00"),
    )

    assert bd.total_payments == _d("19200.00")
    assert bd.total_financed_cost == _d("22100.00")
    assert bd.difference_vs_cash == _d("100.00")
    assert bd.annual_cost_approx == _d("5525.00")


def test_importe_financiado_se_deriva_de_contado_menos_entrada() -> None:
    bd = compute_breakdown(price_cash=_d("18500.00"), deposit=_d("4000.00"))
    assert bd.amount_financed == _d("14500.00")


def test_importe_financiado_explicito_manda_sobre_el_derivado() -> None:
    bd = compute_breakdown(
        price_cash=_d("18500.00"), deposit=_d("4000.00"), amount_financed=_d("15000.00")
    )
    assert bd.amount_financed == _d("15000.00")


def test_datos_ausentes_no_se_convierten_en_cero() -> None:
    bd = compute_breakdown(price_cash=_d("15000.00"))

    assert bd.amount_financed is None
    assert bd.total_payments is None
    assert bd.total_financed_cost is None
    assert bd.difference_vs_cash is None
    assert bd.annual_cost_approx is None


def test_sin_precio_contado_no_hay_diferencia() -> None:
    bd = compute_breakdown(monthly_payment=_d("200.00"), number_of_payments=36)

    assert bd.total_payments == _d("7200.00")
    assert bd.total_financed_cost == _d("7200.00")
    assert bd.difference_vs_cash is None
    assert bd.annual_cost_approx == _d("2400.00")


def test_cero_cuotas_no_calcula_coste_anual() -> None:
    bd = compute_breakdown(monthly_payment=_d("200.00"), number_of_payments=0)
    assert bd.annual_cost_approx is None


def test_redondeo_final_half_up_sin_redondeo_intermedio() -> None:
    bd = compute_breakdown(monthly_payment=_d("33.333"), number_of_payments=3)
    # 33.333 * 3 = 99.999 -> 100.00
    assert bd.total_payments == _d("100.00")
