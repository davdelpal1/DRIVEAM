import pytest
from rest_framework.test import APIClient

from apps.vehicles.models import Vehicle


@pytest.mark.django_db
def test_listado_es_publico_y_paginado(api_client: APIClient) -> None:
    Vehicle.objects.create(make="Seat", model="León")

    response = api_client.get("/api/v1/vehicles/")

    assert response.status_code == 200
    body = response.json()
    assert {"count", "next", "previous", "results"} <= set(body)
    assert body["count"] == 1
    assert body["results"][0]["display_name"] == "Seat León"


@pytest.mark.django_db
def test_anonimo_no_puede_crear(api_client: APIClient) -> None:
    response = api_client.post("/api/v1/vehicles/", {"make": "Seat", "model": "León"})

    assert response.status_code in (401, 403)
    assert Vehicle.objects.count() == 0


@pytest.mark.django_db
def test_usuario_autenticado_crea_vehiculo(authenticated_client: APIClient) -> None:
    response = authenticated_client.post(
        "/api/v1/vehicles/",
        {"make": "Seat", "model": "León", "version": "1.6 TDI"},
    )

    assert response.status_code == 201, response.content
    assert Vehicle.objects.get().version == "1.6 TDI"


@pytest.mark.django_db
def test_filtro_por_marca(api_client: APIClient) -> None:
    Vehicle.objects.create(make="Seat", model="León")
    Vehicle.objects.create(make="Renault", model="Clio")

    response = api_client.get("/api/v1/vehicles/", {"make": "Seat"})

    assert response.json()["count"] == 1
