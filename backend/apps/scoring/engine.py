"""Motor determinista del Car Score V1 (FASE 7).

Reglas puras, sin dependencias de Django (igual que `apps/finance/calculator.py`). A partir de
los datos del candidato y de las preferencias del usuario se obtiene una puntuación 0-100 y un
`ScoreBreakdown` que **explica** el número (PROJECT_VISION §6.6: nunca un "87" a secas).

Principios (CLAUDE.md):

- Todo cálculo con `Decimal`; sin redondeo intermedio, solo el resultado final se cuantiza a
  entero (`ROUND_HALF_UP`).
- La ausencia de un dato **no** se convierte en `0`: si a un factor le falta su insumo, ese
  factor no puntúa y se reparten sus pesos entre los demás.
- Factores activos en la V1: precio, kilómetros, antigüedad, financiación y garantía. Consumo y
  fiabilidad quedan fuera (sin dato / sin fuente fiable) y se listan en `missing`.
- Cada factor se puntúa contra las **preferencias del usuario** (`budget_target`/`budget_max`,
  `min_year`, `max_mileage`); si la preferencia no está fijada se usa una curva de reserva.
- El algoritmo está versionado: `SCORE_VERSION`.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

SCORE_VERSION = "v1"

_HUNDRED = Decimal(100)
_ONE = Decimal(1)

FACTOR_LABELS: dict[str, str] = {
    "price": "Precio",
    "mileage": "Kilómetros",
    "age": "Antigüedad",
    "consumption": "Consumo",
    "financing": "Financiación",
    "warranty": "Garantía",
}

# Factores que la V1 todavía no puntúa (se muestran como pendientes en la interfaz).
# `consumo` se activa en la FASE 8 con la importación por URL; `fiabilidad` sigue sin fuente.
DEFERRED_FACTORS: tuple[str, ...] = ("Fiabilidad",)


@dataclass(frozen=True)
class ScoreWeights:
    """Pesos 0-100 tal y como los guarda `UserPreference` (el motor los normaliza)."""

    price: int
    mileage: int
    age: int
    consumption: int
    financing: int
    warranty: int


@dataclass(frozen=True)
class ScoreInputs:
    """Datos del candidato y umbrales de preferencia necesarios para puntuar."""

    reference_year: int
    price_cash: Decimal | None = None
    mileage_km: int | None = None
    year: int | None = None
    warranty_months: int | None = None
    fuel_consumption: Decimal | None = None
    finance_difference_vs_cash: Decimal | None = None
    budget_target: Decimal | None = None
    budget_max: Decimal | None = None
    min_year: int | None = None
    max_mileage: int | None = None


@dataclass(frozen=True)
class FactorScore:
    key: str
    label: str
    score: int
    weight: str  # peso normalizado, p. ej. "0.31"
    detail: str


@dataclass(frozen=True)
class ScoreBreakdown:
    score: int | None
    version: str
    label: str
    summary: str
    factors: list[FactorScore]
    missing: list[str]


def _clamp(value: Decimal) -> Decimal:
    if value < 0:
        return Decimal(0)
    if value > _HUNDRED:
        return _HUNDRED
    return value


def _to_int(value: Decimal) -> int:
    return int(_clamp(value).quantize(_ONE, rounding=ROUND_HALF_UP))


def _int_es(value: int) -> str:
    """Entero con separador de miles español (12000 -> "12.000")."""
    return f"{value:,}".replace(",", ".")


# --- Curvas por factor ------------------------------------------------------------------
# Cada función devuelve (subpuntuación 0-100, texto explicativo) o `None` si falta el dato.


def _price_factor(
    price: Decimal | None, budget_target: Decimal | None, budget_max: Decimal | None
) -> tuple[Decimal, str] | None:
    if price is None or budget_max is None or budget_max <= 0:
        return None
    has_target = bool(budget_target) and budget_target is not None and budget_target < budget_max
    target = budget_target if has_target else budget_max * Decimal("0.85")
    assert target is not None
    price_eur = f"{_int_es(int(price))} €"
    if price <= target:
        return _HUNDRED, f"{price_eur}, por debajo de tu objetivo ({_int_es(int(target))} €)"
    if price >= budget_max:
        return Decimal(0), f"{price_eur}, en o por encima de tu presupuesto máximo"
    sub = _HUNDRED * (budget_max - price) / (budget_max - target)
    return sub, f"{price_eur}, entre tu objetivo y tu presupuesto máximo"


def _mileage_factor(mileage: int | None, max_mileage: int | None) -> tuple[Decimal, str] | None:
    if mileage is None:
        return None
    m = Decimal(mileage)
    label = f"{_int_es(mileage)} km"
    if max_mileage and max_mileage > 0:
        cap = Decimal(max_mileage)
        if m >= cap * 2:
            return Decimal(0), f"{label}, más del doble de tu máximo"
        if m <= cap:
            within = f"{label}, dentro de tu máximo ({_int_es(max_mileage)} km)"
            return _HUNDRED - Decimal(60) * m / cap, within
        return Decimal(40) - Decimal(40) * (m - cap) / cap, f"{label}, por encima de tu máximo"
    if m >= 250_000:
        return Decimal(0), f"{label}, kilometraje muy alto"
    if m <= 100_000:
        return _HUNDRED - Decimal(50) * m / Decimal(100_000), label
    if m <= 200_000:
        return Decimal(50) - Decimal(40) * (m - 100_000) / Decimal(100_000), label
    return Decimal(10) - Decimal(10) * (m - 200_000) / Decimal(50_000), f"{label}, kilometraje alto"


def _age_factor(
    year: int | None, reference_year: int, min_year: int | None
) -> tuple[Decimal, str] | None:
    if year is None:
        return None
    age = max(reference_year - year, 0)
    sub = _clamp(_HUNDRED - Decimal(8) * Decimal(age))
    detail = f"del {year} ({age} {'año' if age == 1 else 'años'})"
    if min_year is not None and year < min_year:
        sub = min(sub, Decimal(30))
        detail = f"del {year}, anterior a tu año mínimo ({min_year})"
    return sub, detail


def _financing_factor(
    difference_vs_cash: Decimal | None, price: Decimal | None
) -> tuple[Decimal, str] | None:
    if difference_vs_cash is None or price is None or price <= 0:
        return None
    ratio = difference_vs_cash / price
    over = f"{_int_es(int(difference_vs_cash))} €"
    if ratio <= 0:
        return _HUNDRED, "financiarlo no encarece el coche"
    if ratio >= Decimal("0.25"):
        return Decimal(0), f"financiarlo lo encarece {over} (más del 25 %)"
    sub = _HUNDRED * (Decimal("0.25") - ratio) / Decimal("0.25")
    return sub, f"financiarlo lo encarece {over}"


def _consumption_factor(consumption: Decimal | None) -> tuple[Decimal, str] | None:
    """Consumo medio (L/100 km). Curva de reserva: <=4 excelente, >=9 penaliza del todo.

    La V1 no tiene consumo objetivo del usuario ni cohortes de mercado (eso es la Score V2),
    así que se usa una escala absoluta razonable para turismos.
    """
    if consumption is None or consumption <= 0:
        return None
    label = f"{consumption:.1f} L/100 km".replace(".", ",")
    if consumption <= 4:
        return _HUNDRED, f"{label}, consumo muy contenido"
    if consumption >= 9:
        return Decimal(0), f"{label}, consumo elevado"
    sub = _HUNDRED * (Decimal(9) - consumption) / Decimal(5)
    return sub, label


def _warranty_factor(months: int | None) -> tuple[Decimal, str] | None:
    if months is None:
        return None
    m = Decimal(months)
    label = f"{months} {'mes' if months == 1 else 'meses'} de garantía"
    if m >= 36:
        return _HUNDRED, label
    if m >= 24:
        return Decimal(90) + Decimal(10) * (m - 24) / Decimal(12), label
    if m >= 12:
        return Decimal(60) + Decimal(30) * (m - 12) / Decimal(12), label
    return Decimal(20) + Decimal(40) * m / Decimal(12), label


_BANDS: tuple[tuple[int, str], ...] = (
    (85, "Muy buen candidato"),
    (70, "Buen candidato"),
    (50, "Candidato correcto"),
    (0, "Candidato con reservas"),
)


def _band_label(score: int) -> str:
    for threshold, label in _BANDS:
        if score >= threshold:
            return label
    return "Candidato con reservas"


def _build_summary(score: int, label: str, present: list[tuple[str, Decimal]]) -> str:
    by_desc = sorted(present, key=lambda item: item[1], reverse=True)
    strengths = [FACTOR_LABELS[k].lower() for k, sub in by_desc if sub >= 60][:2]
    weaknesses = [FACTOR_LABELS[k].lower() for k, sub in reversed(by_desc) if sub < 45][:1]
    parts = [f"{score}/100 · {label.lower()}."]
    if strengths:
        parts.append("A favor: " + " y ".join(strengths) + ".")
    if weaknesses:
        parts.append("Penaliza: " + weaknesses[0] + ".")
    return " ".join(parts)


def compute_score(*, inputs: ScoreInputs, weights: ScoreWeights) -> ScoreBreakdown:
    price = _price_factor(inputs.price_cash, inputs.budget_target, inputs.budget_max)
    raw: list[tuple[str, tuple[Decimal, str] | None, int]] = [
        ("price", price, weights.price),
        ("mileage", _mileage_factor(inputs.mileage_km, inputs.max_mileage), weights.mileage),
        ("age", _age_factor(inputs.year, inputs.reference_year, inputs.min_year), weights.age),
        ("consumption", _consumption_factor(inputs.fuel_consumption), weights.consumption),
        (
            "financing",
            _financing_factor(inputs.finance_difference_vs_cash, inputs.price_cash),
            weights.financing,
        ),
        ("warranty", _warranty_factor(inputs.warranty_months), weights.warranty),
    ]

    present = [(key, result, weight) for key, result, weight in raw if result is not None]
    missing = [FACTOR_LABELS[key] for key, result, _ in raw if result is None]
    missing.extend(DEFERRED_FACTORS)

    if not present:
        return ScoreBreakdown(
            score=None,
            version=SCORE_VERSION,
            label="Sin datos suficientes",
            summary="No hay datos suficientes para puntuar este candidato.",
            factors=[],
            missing=missing,
        )

    total_weight = sum(weight for _, _, weight in present)
    norm: dict[str, Decimal] = {}
    for key, _, weight in present:
        norm[key] = (
            Decimal(weight) / Decimal(total_weight)
            if total_weight > 0
            else _ONE / Decimal(len(present))
        )

    weighted = sum((result[0] * norm[key] for key, result, _ in present), start=Decimal(0))
    final = _to_int(weighted)
    label = _band_label(final)

    factors = [
        FactorScore(
            key=key,
            label=FACTOR_LABELS[key],
            score=_to_int(result[0]),
            weight=f"{norm[key]:.2f}",
            detail=result[1],
        )
        for key, result, _ in present
    ]
    summary = _build_summary(final, label, [(key, result[0]) for key, result, _ in present])

    return ScoreBreakdown(
        score=final,
        version=SCORE_VERSION,
        label=label,
        summary=summary,
        factors=factors,
        missing=missing,
    )
