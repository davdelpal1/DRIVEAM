from typing import Any

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.accounts.models import UserPreference

User = get_user_model()

PREFERENCES_URL = "/api/v1/preferences/"


@pytest.mark.django_db
def test_anonimo_no_puede_ver_preferencias(api_client: APIClient) -> None:
    assert api_client.get(PREFERENCES_URL).status_code in (401, 403)


@pytest.mark.django_db
def test_get_autocrea_las_preferencias_con_valores_por_defecto(user_client: APIClient) -> None:
    response = user_client.get(PREFERENCES_URL)

    assert response.status_code == 200
    body = response.json()
    assert body["weight_price"] == 25
    assert body["weight_warranty"] == 5
    assert body["budget_max"] is None
    assert body["fuel_types"] == []
    assert UserPreference.objects.count() == 1


@pytest.mark.django_db
def test_patch_actualiza_presupuesto_pesos_y_combustibles(user_client: APIClient) -> None:
    response = user_client.patch(
        PREFERENCES_URL,
        {
            "budget_target": "12000.00",
            "budget_max": "15000.00",
            "min_year": 2018,
            "fuel_types": ["diesel", "hibrido"],
            "weight_price": 40,
        },
        format="json",
    )

    assert response.status_code == 200, response.content
    body = response.json()
    assert body["budget_target"] == "12000.00"
    assert body["fuel_types"] == ["diesel", "hibrido"]
    assert body["weight_price"] == 40


@pytest.mark.django_db
def test_patch_rechaza_peso_fuera_de_rango(user_client: APIClient) -> None:
    response = user_client.patch(PREFERENCES_URL, {"weight_price": 150}, format="json")

    assert response.status_code == 400
    assert "weight_price" in response.json()


@pytest.mark.django_db
def test_patch_rechaza_presupuesto_negativo(user_client: APIClient) -> None:
    response = user_client.patch(PREFERENCES_URL, {"budget_max": "-1"}, format="json")

    assert response.status_code == 400
    assert "budget_max" in response.json()


@pytest.mark.django_db
def test_patch_rechaza_combustibles_que_no_son_lista(user_client: APIClient) -> None:
    response = user_client.patch(PREFERENCES_URL, {"fuel_types": "diesel"}, format="json")

    assert response.status_code == 400
    assert "fuel_types" in response.json()


@pytest.mark.django_db
def test_cada_usuario_ve_solo_sus_preferencias(user: Any, user_client: APIClient) -> None:
    otro = User.objects.create_user(email="otro@example.test", password="clave-de-prueba-123")
    UserPreference.objects.create(user=otro, weight_price=99)

    response = user_client.get(PREFERENCES_URL)

    assert response.status_code == 200
    assert response.json()["weight_price"] == 25
    assert response.json()["weight_price"] != 99
