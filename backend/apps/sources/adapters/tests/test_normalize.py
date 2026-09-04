"""Normalizadores puros de la importación (FASE 8)."""

from decimal import Decimal

import pytest

from apps.sources.adapters.normalize import (
    consumption_from,
    fuel_type_from,
    power_cv_from,
    to_decimal,
    to_positive_int,
    year_from,
)


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("12.490,50 €", Decimal("12490.50")),
        ("12490.5", Decimal("12490.5")),
        ("15.499", Decimal("15499")),
        ("1.234,00", Decimal("1234.00")),
        ("18990.00", Decimal("18990.00")),
        ("", None),
        ("consultar", None),
        (None, None),
    ],
)
def test_to_decimal(text: object, expected: Decimal | None) -> None:
    assert to_decimal(text) == expected


def test_to_positive_int_descarta_negativos() -> None:
    assert to_positive_int("87.320 km") == 87320
    assert to_positive_int("-5") is None


@pytest.mark.parametrize(
    ("text", "expected"),
    [("2021-06-15", 2021), ("Del 2018", 2018), ("sin fecha", None), ("1850", None)],
)
def test_year_from(text: str, expected: int | None) -> None:
    assert year_from(text) == expected


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Diésel", "diesel"),
        ("Gasolina", "gasolina"),
        ("Híbrido enchufable", "hibrido_enchufable"),
        ("Hybrid", "hibrido"),
        ("Eléctrico", "electrico"),
        ("madera", None),
    ],
)
def test_fuel_type_from(text: str, expected: str | None) -> None:
    assert fuel_type_from(text) == expected


def test_power_cv_convierte_kw() -> None:
    assert power_cv_from("96", "KWT") == 131
    assert power_cv_from("130", "") == 130
    assert power_cv_from("0") is None


def test_consumption_descarta_absurdos() -> None:
    assert consumption_from("5.4") == Decimal("5.4")
    assert consumption_from("0") is None
    assert consumption_from("120") is None
