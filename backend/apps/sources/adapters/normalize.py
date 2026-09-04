"""Normalizadores puros compartidos por los adaptadores (FASE 8).

Convierten los textos que aparecen en una página (`"87.320 km"`, `"12.490 €"`, `"Diésel"`) a
los tipos del dominio, conservando el criterio de CLAUDE.md: ante la duda, `None` — nunca `0`.
"""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation

# Valores de `apps.vehicles.enums.FuelType` (estables, forman parte del dominio).
_FUEL_MAP: tuple[tuple[tuple[str, ...], str], ...] = (
    (("plug-in", "plugin", "enchufable", "phev"), "hibrido_enchufable"),
    (("hibrido", "híbrido", "hybrid", "hev", "mhev"), "hibrido"),
    (("electric", "eléctric", "electrico", "bev", "ev"), "electrico"),
    (("diesel", "diésel", "gasoil", "gasóleo", "gasoleo"), "diesel"),
    (("gasolina", "petrol", "gasoline", "nafta", "benzin"), "gasolina"),
    (("glp", "lpg", "autogas", "autogás"), "glp"),
    (("gnc", "cng", "gnv", "gas natural"), "gnc"),
)


def to_decimal(value: object) -> Decimal | None:
    """`"12.490,50 €"` / `"12490.5"` / `12490` -> `Decimal`. `None` si no hay número."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float, Decimal)):
        try:
            return Decimal(str(value))
        except InvalidOperation:
            return None
    text = re.sub(r"[^\d,.\-]", "", str(value).strip())
    if not text or text in {"-", ".", ","}:
        return None
    if "," in text and "." in text:
        # El separador que aparece más a la derecha es el decimal; el otro son miles.
        decimal_sep = "," if text.rfind(",") > text.rfind(".") else "."
        thousands_sep = "." if decimal_sep == "," else ","
        text = text.replace(thousands_sep, "").replace(decimal_sep, ".")
    elif "," in text:
        # Coma sola: decimal si deja 1-2 dígitos detrás, si no separador de miles.
        text = text.replace(",", "." if len(text.rsplit(",", 1)[-1]) in (1, 2) else "")
    elif text.count(".") == 1 and len(text.rsplit(".", 1)[-1]) == 3:
        # Punto solo con 3 dígitos detrás ("15.499"): en es-ES es separador de miles.
        text = text.replace(".", "")
    try:
        result = Decimal(text)
    except InvalidOperation:
        return None
    return result


def to_int(value: object) -> int | None:
    dec = to_decimal(value)
    return None if dec is None else int(dec)


def to_positive_int(value: object) -> int | None:
    result = to_int(value)
    return result if result is not None and result >= 0 else None


def year_from(value: object) -> int | None:
    """Extrae un año de 4 cifras de un texto o de una fecha ISO."""
    if value is None:
        return None
    match = re.search(r"(19|20)\d{2}", str(value))
    if not match:
        return None
    year = int(match.group(0))
    return year if 1900 <= year <= 2100 else None


def fuel_type_from(value: object) -> str | None:
    """Texto libre de combustible -> valor de `FuelType`. `None` si no se reconoce."""
    if not value:
        return None
    text = str(value).lower()
    for needles, fuel in _FUEL_MAP:
        if any(needle in text for needle in needles):
            return fuel
    return None


def power_cv_from(value: object, unit: object = None) -> int | None:
    """Potencia -> CV. Si la unidad es kW, convierte; si no se sabe, se asume CV."""
    number = to_decimal(value)
    if number is None or number <= 0:
        return None
    unit_text = str(unit or "").lower()
    if "kwt" in unit_text or re.search(r"\bkw\b", unit_text):
        return int((number * Decimal("1.35962")).quantize(Decimal(1)))
    return int(number.quantize(Decimal(1)))


def consumption_from(value: object) -> Decimal | None:
    """Consumo medio en L/100 km, una cifra decimal. Descarta valores absurdos."""
    number = to_decimal(value)
    if number is None:
        return None
    number = number.quantize(Decimal("0.1"))
    return number if Decimal("1") <= number <= Decimal("30") else None
