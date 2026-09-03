"""El Car Score (FASE 7) se expone y se recalcula a través del endpoint de candidatos."""

from typing import Any

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.scoring.engine import SCORE_VERSION
from apps.scoring.models import Score

CANDIDATES = "/api/v1/candidates/"
PREFERENCES = "/api/v1/preferences/"


def _candidate(client: APIClient, **overrides: Any) -> int:
    data = {
        "make": "Seat",
        "model": "León",
        "price_cash": "14000.00",
        "year": 2021,
        "mileage_km": 60000,
        "warranty_months": 12,
    }
    data.update(overrides)
    return int(client.post(CANDIDATES, data, format="json").json()["id"])


def _row(client: APIClient, cid: int) -> dict[str, Any]:
    return next(r for r in client.get(CANDIDATES).json()["results"] if r["id"] == cid)


@pytest.mark.django_db
def test_el_candidato_se_crea_con_car_score_persistido(user_client: APIClient) -> None:
    cid = _candidate(user_client)

    row = _row(user_client, cid)
    assert isinstance(row["score"], int)
    assert row["score_breakdown"]["version"] == SCORE_VERSION
    assert row["score_breakdown"]["summary"]

    stored = Score.objects.get(listing_id=cid, version=SCORE_VERSION)
    assert stored.score == row["score"]


@pytest.mark.django_db
def test_cambiar_preferencias_recalcula_el_score(user_client: APIClient) -> None:
    cid = _candidate(user_client, price_cash="12000.00")
    before = _row(user_client, cid)["score"]

    user_client.put(
        PREFERENCES,
        {
            "budget_target": "12500.00",
            "budget_max": "16000.00",
            "weight_price": 100,
            "weight_mileage": 0,
            "weight_age": 0,
            "weight_reliability": 0,
            "weight_consumption": 0,
            "weight_financing": 0,
            "weight_warranty": 0,
            "fuel_types": [],
            "body_types": [],
        },
        format="json",
    )

    after = _row(user_client, cid)
    factor_keys = {f["key"] for f in after["score_breakdown"]["factors"]}
    assert "price" in factor_keys  # ahora hay presupuesto -> el precio puntúa
    assert after["score"] == 100  # precio por debajo del objetivo y todo el peso en precio
    assert after["score"] != before


@pytest.mark.django_db
def test_guardar_financiacion_anade_el_factor_financiacion(user_client: APIClient) -> None:
    cid = _candidate(user_client)
    assert "financing" not in {
        f["key"] for f in _row(user_client, cid)["score_breakdown"]["factors"]
    }

    user_client.put(
        f"{CANDIDATES}{cid}/finance/",
        {"deposit": "3000.00", "monthly_payment": "200.00", "number_of_payments": 60},
        format="json",
    )

    factor_keys = {f["key"] for f in _row(user_client, cid)["score_breakdown"]["factors"]}
    assert "financing" in factor_keys


@pytest.mark.django_db
def test_el_score_es_por_usuario(user_client: APIClient, user: Any) -> None:
    cid = _candidate(user_client)

    other = get_user_model().objects.create_user(email="otra@example.test", password="x-clave-123")
    intruder = APIClient()
    intruder.force_authenticate(user=other)
    assert intruder.get(f"{CANDIDATES}{cid}/").status_code == 404
