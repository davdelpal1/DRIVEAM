import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_health_devuelve_ok(api_client: APIClient) -> None:
    response = api_client.get("/api/v1/health/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


@pytest.mark.django_db
def test_health_no_requiere_autenticacion(api_client: APIClient) -> None:
    # El resto de la API es IsAuthenticated por defecto; health es explícitamente público.
    response = api_client.get("/api/v1/health/")

    assert response.status_code != 401
    assert response.status_code != 403


@pytest.mark.django_db
def test_esquema_openapi_disponible(api_client: APIClient) -> None:
    response = api_client.get("/api/v1/schema/")

    assert response.status_code == 200
    assert "health" in response.content.decode()
