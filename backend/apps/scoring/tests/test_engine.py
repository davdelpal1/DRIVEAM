"""Tests deterministas del motor del Car Score V1 (FASE 7, obligatorios).

Cifras exactas por factor, normalización de pesos y comprobación de que un factor sin dato
se excluye del reparto (nunca cuenta como 0).
"""

from decimal import Decimal

from apps.scoring.engine import (
    SCORE_VERSION,
    ScoreInputs,
    ScoreWeights,
    compute_score,
)

DEFAULT_WEIGHTS = ScoreWeights(price=25, mileage=20, age=15, financing=10, warranty=5)


def _d(value: str) -> Decimal:
    return Decimal(value)


def test_caso_completo_con_cifras_exactas() -> None:
    bd = compute_score(
        inputs=ScoreInputs(
            reference_year=2026,
            price_cash=_d("12000.00"),
            mileage_km=60_000,
            year=2021,
            warranty_months=12,
            budget_target=_d("13000.00"),
            budget_max=_d("16000.00"),
            min_year=2018,
            max_mileage=120_000,
        ),
        weights=DEFAULT_WEIGHTS,
    )

    by_key = {f.key: f for f in bd.factors}
    assert by_key["price"].score == 100
    assert by_key["mileage"].score == 70
    assert by_key["age"].score == 60
    assert by_key["warranty"].score == 60
    assert "financing" not in by_key  # sin oferta -> no puntúa
    # (100*25 + 70*20 + 60*15 + 60*5) / 65 = 5100 / 65 = 78.46 -> 78
    assert bd.score == 78
    assert bd.label == "Buen candidato"
    assert bd.version == SCORE_VERSION
    assert "Financiación" in bd.missing


def test_un_factor_sin_dato_no_cuenta_como_cero() -> None:
    bd = compute_score(
        inputs=ScoreInputs(
            reference_year=2026,
            price_cash=_d("12000.00"),
            budget_target=_d("13000.00"),
            budget_max=_d("16000.00"),
        ),
        weights=DEFAULT_WEIGHTS,
    )
    # Solo el precio tiene dato: la puntuación es la suya, no se diluye con los ausentes.
    assert bd.score == 100
    assert [f.key for f in bd.factors] == ["price"]


def test_sin_ningun_dato_no_hay_puntuacion() -> None:
    bd = compute_score(inputs=ScoreInputs(reference_year=2026), weights=DEFAULT_WEIGHTS)
    assert bd.score is None
    assert bd.label == "Sin datos suficientes"
    assert bd.factors == []


def test_pesos_distintos_invierten_el_ranking() -> None:
    barato_viejo = ScoreInputs(
        reference_year=2026,
        price_cash=_d("12000.00"),
        year=2016,
        budget_target=_d("13000.00"),
        budget_max=_d("16000.00"),
    )
    caro_nuevo = ScoreInputs(
        reference_year=2026,
        price_cash=_d("15500.00"),
        year=2024,
        budget_target=_d("13000.00"),
        budget_max=_d("16000.00"),
    )
    solo_precio = ScoreWeights(price=100, mileage=0, age=0, financing=0, warranty=0)
    solo_antiguedad = ScoreWeights(price=0, mileage=0, age=100, financing=0, warranty=0)

    a1 = compute_score(inputs=barato_viejo, weights=solo_precio).score
    b1 = compute_score(inputs=caro_nuevo, weights=solo_precio).score
    a2 = compute_score(inputs=barato_viejo, weights=solo_antiguedad).score
    b2 = compute_score(inputs=caro_nuevo, weights=solo_antiguedad).score

    assert a1 is not None and b1 is not None and a2 is not None and b2 is not None
    assert a1 > b1  # priorizando precio gana el barato
    assert b2 > a2  # priorizando antigüedad gana el nuevo


def test_curva_de_garantia() -> None:
    def warranty(months: int) -> int:
        bd = compute_score(
            inputs=ScoreInputs(reference_year=2026, warranty_months=months),
            weights=DEFAULT_WEIGHTS,
        )
        assert bd.score is not None
        return bd.score

    assert warranty(0) == 20
    assert warranty(6) == 40
    assert warranty(12) == 60
    assert warranty(24) == 90
    assert warranty(36) == 100


def test_factor_financiacion_por_sobrecoste() -> None:
    bd = compute_score(
        inputs=ScoreInputs(
            reference_year=2026,
            price_cash=_d("10000.00"),
            finance_difference_vs_cash=_d("1000.00"),
        ),
        weights=DEFAULT_WEIGHTS,
    )
    financing = next(f for f in bd.factors if f.key == "financing")
    # ratio 0.10 -> 100 * (0.25 - 0.10) / 0.25 = 60
    assert financing.score == 60


def test_antiguedad_penaliza_por_debajo_del_ano_minimo() -> None:
    bd = compute_score(
        inputs=ScoreInputs(reference_year=2026, year=2020, min_year=2023),
        weights=DEFAULT_WEIGHTS,
    )
    age = next(f for f in bd.factors if f.key == "age")
    assert age.score == 30  # tope al estar por debajo del año mínimo
