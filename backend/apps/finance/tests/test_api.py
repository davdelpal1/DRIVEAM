"""API de la FASE 6: calculadora sin estado y oferta de financiación por candidato."""

from typing import Any

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.finance.models import FinanceOffer

CALCULATE = "/api/v1/finance/calculate/"
CANDIDATES = "/api/v1/candidates/"


def _candidate(client: APIClient, **overrides: Any) -> int:
    data = {"make": "Seat", "model": "León", "price_cash": "15000.00"}
    data.update(overrides)
    return int(client.post(CANDIDATES, data, format="json").json()["id"])


@pytest.mark.django_db
def test_calcular_sin_persistir(user_client: APIClient) -> None:
    response = user_client.post(
        CALCULATE,
        {
            "price_cash": "15000.00",
            "deposit": "3000.00",
            "monthly_payment": "200.00",
            "number_of_payments": 60,
            "opening_fee": "300.00",
        },
        format="json",
    )

    assert response.status_code == 200, response.content
    breakdown = response.json()["breakdown"]
    assert breakdown["total_financed_cost"] == "15300.00"
    assert breakdown["difference_vs_cash"] == "300.00"
    assert breakdown["annual_cost_approx"] == "3060.00"
    assert FinanceOffer.objects.count() == 0


@pytest.mark.django_db
def test_calcular_requiere_autenticacion(api_client: APIClient) -> None:
    assert api_client.post(CALCULATE, {}, format="json").status_code in (401, 403)


@pytest.mark.django_db
def test_financiacion_por_candidato_ciclo_completo(user_client: APIClient) -> None:
    cid = _candidate(user_client)
    url = f"{CANDIDATES}{cid}/finance/"

    assert user_client.get(url).status_code == 204

    put = user_client.put(
        url,
        {
            "deposit": "3000.00",
            "monthly_payment": "200.00",
            "number_of_payments": 60,
            "opening_fee": "200.00",
        },
        format="json",
    )
    assert put.status_code == 200, put.content
    assert put.json()["breakdown"]["total_financed_cost"] == "15200.00"

    # PUT de nuevo actualiza la misma oferta, no crea otra.
    user_client.put(url, {"monthly_payment": "180.00", "number_of_payments": 60}, format="json")
    assert FinanceOffer.objects.filter(listing_id=cid).count() == 1

    got = user_client.get(url)
    assert got.status_code == 200
    assert got.json()["monthly_payment"] == "180.00"

    assert user_client.delete(url).status_code == 204
    assert not FinanceOffer.objects.filter(listing_id=cid).exists()


@pytest.mark.django_db
def test_financiacion_de_candidato_ajeno_no_es_accesible(user_client: APIClient) -> None:
    cid = _candidate(user_client)

    other = get_user_model().objects.create_user(email="otra@example.test", password="x-clave-123")
    intruder = APIClient()
    intruder.force_authenticate(user=other)

    assert intruder.get(f"{CANDIDATES}{cid}/finance/").status_code == 404
    assert (
        intruder.put(
            f"{CANDIDATES}{cid}/finance/", {"monthly_payment": "1.00"}, format="json"
        ).status_code
        == 404
    )


@pytest.mark.django_db
def test_listado_de_candidatos_expone_el_coste_financiado(user_client: APIClient) -> None:
    with_offer = _candidate(user_client, make="Kia")
    _candidate(user_client, make="Opel")
    user_client.put(
        f"{CANDIDATES}{with_offer}/finance/",
        {
            "deposit": "3000.00",
            "monthly_payment": "200.00",
            "number_of_payments": 60,
            "opening_fee": "200.00",
        },
        format="json",
    )

    by_id = {row["id"]: row for row in user_client.get(CANDIDATES).json()["results"]}
    assert by_id[with_offer]["finance_total_cost"] == "15200.00"
    assert by_id[with_offer]["finance_difference_vs_cash"] == "200.00"
    other_id = next(i for i in by_id if i != with_offer)
    assert by_id[other_id]["finance_total_cost"] is None
    assert by_id[other_id]["finance_difference_vs_cash"] is None
