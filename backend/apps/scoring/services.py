"""Puente entre el motor puro del Car Score y los modelos de Django (FASE 7).

El motor (`apps.scoring.engine`) no sabe nada de Django. Aquí se leen los datos del candidato
(`Vehicle` + `Listing` + `FinanceOffer`) y las preferencias del usuario, se calcula el
desglose y se **persiste** en el modelo `Score` (una fila por candidato/usuario/versión).

El recálculo se dispara desde:

- el alta y la edición de candidatos (`apps.listings.services`),
- la oferta de financiación (`CandidateViewSet.finance`),
- el guardado de preferencias (`UserPreferenceView`),
- y, como red de seguridad, la primera lectura sin fila `Score` (`CandidateSerializer`).
"""

from __future__ import annotations

from dataclasses import asdict
from datetime import date
from typing import Any

from django.utils import timezone

from apps.accounts.models import User, UserPreference
from apps.finance.api import breakdown_for_offer
from apps.listings.models import Listing
from apps.scoring.engine import (
    SCORE_VERSION,
    ScoreBreakdown,
    ScoreInputs,
    ScoreWeights,
    compute_score,
)
from apps.scoring.models import Score

# Centinela: "búscala en la BD"; distinto de `None`, que significa "no hay oferta".
_LOOKUP: Any = object()


def serialize_breakdown(breakdown: ScoreBreakdown) -> dict[str, Any]:
    """`ScoreBreakdown` -> dict JSON-serializable para guardar y para la API."""
    return asdict(breakdown)


def score_breakdown_for(listing: Listing, user: User, *, offer: Any = _LOOKUP) -> ScoreBreakdown:
    """Calcula el desglose del candidato para el usuario, sin persistir.

    `offer` permite pasar la oferta de financiación ya cargada (p. ej. la recién guardada en
    `CandidateViewSet.finance`, donde el prefetch del `listing` está obsoleto). `None` = sin
    oferta; omitirlo = búscala en la BD.
    """
    preference, _ = UserPreference.objects.get_or_create(user=user)

    if offer is _LOOKUP:
        offer = listing.finance_offers.first()
    difference_vs_cash = (
        breakdown_for_offer(offer).difference_vs_cash if offer is not None else None
    )

    inputs = ScoreInputs(
        reference_year=date.today().year,
        price_cash=listing.price_cash,
        mileage_km=listing.mileage_km,
        year=listing.vehicle.first_registration_year,
        warranty_months=listing.warranty_months,
        fuel_consumption=listing.vehicle.fuel_consumption,
        finance_difference_vs_cash=difference_vs_cash,
        budget_target=preference.budget_target,
        budget_max=preference.budget_max,
        min_year=preference.min_year,
        max_mileage=preference.max_mileage,
    )
    weights = ScoreWeights(
        price=preference.weight_price,
        mileage=preference.weight_mileage,
        age=preference.weight_age,
        consumption=preference.weight_consumption,
        financing=preference.weight_financing,
        warranty=preference.weight_warranty,
    )
    return compute_score(inputs=inputs, weights=weights)


def recalculate_score(*, listing: Listing, user: User, offer: Any = _LOOKUP) -> Score:
    """Recalcula y guarda el `Score` del candidato para el usuario (versión actual)."""
    breakdown = score_breakdown_for(listing, user, offer=offer)
    score, _ = Score.objects.update_or_create(
        listing=listing,
        user=user,
        version=SCORE_VERSION,
        defaults={
            "score": breakdown.score or 0,
            "breakdown": serialize_breakdown(breakdown),
            "calculated_at": timezone.now(),
        },
    )
    return score


def recalculate_for_user(user: User) -> None:
    """Recalcula el `Score` de todos los candidatos manuales del usuario."""
    listings = (
        Listing.objects.filter(owner=user)
        .select_related("vehicle")
        .prefetch_related("finance_offers")
    )
    for listing in listings:
        recalculate_score(listing=listing, user=user)
