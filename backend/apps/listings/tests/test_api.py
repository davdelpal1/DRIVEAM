from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.listings.models import Listing
from apps.sources.models import Source
from apps.vehicles.models import Vehicle


@pytest.fixture
def source(db: None) -> Source:
    return Source.objects.create(name="Portal X", slug="portal-x")


@pytest.fixture
def vehicle(db: None) -> Vehicle:
    return Vehicle.objects.create(make="Seat", model="León")


@pytest.mark.django_db
def test_crear_vehiculo_y_asociarlo_a_un_anuncio_desde_la_api(
    authenticated_client: APIClient,
) -> None:
    creado = authenticated_client.post("/api/v1/vehicles/", {"make": "Seat", "model": "León"})
    vehicle_id = creado.json()["id"]
    source = Source.objects.create(name="Portal X", slug="portal-x")

    response = authenticated_client.post(
        "/api/v1/listings/",
        {
            "vehicle": vehicle_id,
            "source": source.pk,
            "url": "https://ejemplo.test/1",
            "price_cash": "10500.00",
        },
    )

    assert response.status_code == 201, response.content
    body = response.json()
    assert body["price_cash"] == "10500.00"  # los importes viajan como cadena decimal
    assert body["vehicle_detail"]["display_name"] == "Seat León"


@pytest.mark.django_db
def test_detalle_incluye_vehiculo_anidado(
    api_client: APIClient, source: Source, vehicle: Vehicle
) -> None:
    listing = Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/1")

    response = api_client.get(f"/api/v1/listings/{listing.pk}/")

    assert response.status_code == 200
    assert response.json()["vehicle_detail"]["make"] == "Seat"


@pytest.mark.django_db
def test_filtro_por_rango_de_precio(
    api_client: APIClient, source: Source, vehicle: Vehicle
) -> None:
    Listing.objects.create(
        source=source, vehicle=vehicle, url="https://ejemplo.test/1", price_cash=Decimal("8000")
    )
    Listing.objects.create(
        source=source, vehicle=vehicle, url="https://ejemplo.test/2", price_cash=Decimal("15000")
    )

    response = api_client.get("/api/v1/listings/", {"price_cash_max": "10000"})

    assert response.json()["count"] == 1


@pytest.mark.django_db
def test_ordenacion_por_precio_ascendente(
    api_client: APIClient, source: Source, vehicle: Vehicle
) -> None:
    Listing.objects.create(
        source=source, vehicle=vehicle, url="https://ejemplo.test/1", price_cash=Decimal("15000")
    )
    Listing.objects.create(
        source=source, vehicle=vehicle, url="https://ejemplo.test/2", price_cash=Decimal("8000")
    )

    response = api_client.get("/api/v1/listings/", {"ordering": "price_cash"})

    precios = [row["price_cash"] for row in response.json()["results"]]
    assert precios == ["8000.00", "15000.00"]
