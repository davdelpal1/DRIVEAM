"""API de candidatos (alta manual, FASE 3): endpoint plano `/api/v1/candidates/`."""

from typing import Any

import pytest
from rest_framework.test import APIClient

from apps.favorites.models import Favorite, UserVehicleNote
from apps.listings.models import Listing
from apps.vehicles.models import Vehicle

BASE = "/api/v1/candidates/"


def _payload(**overrides: Any) -> dict[str, Any]:
    data = {
        "make": "Seat",
        "model": "León",
        "version": "1.5 TSI FR",
        "fuel_type": "gasolina",
        "power_cv": 150,
        "year": 2021,
        "mileage_km": 42000,
        "price_cash": "18500.00",
        "seller_name": "Concesionario Norte",
        "warranty_months": 12,
        "location": "Sevilla",
        "notes": "Único dueño, revisiones en marca.",
    }
    data.update(overrides)
    return data


@pytest.mark.django_db
def test_crear_candidato_crea_vehiculo_anuncio_y_nota(user_client: APIClient, user: Any) -> None:
    response = user_client.post(BASE, _payload(), format="json")

    assert response.status_code == 201, response.content
    body = response.json()
    assert body["make"] == "Seat"
    assert body["price_cash"] == "18500.00"
    assert body["is_archived"] is False and body["is_favorite"] is False

    listing = Listing.objects.get(pk=body["id"])
    assert listing.owner_id == user.id
    assert listing.source.slug == "manual"
    assert listing.vehicle.first_registration_year == 2021
    assert listing.seller is not None and listing.seller.name == "Concesionario Norte"
    assert UserVehicleNote.objects.filter(listing=listing, user=user).count() == 1


@pytest.mark.django_db
def test_candidato_es_privado_por_usuario(user_client: APIClient, api_client: APIClient) -> None:
    from django.contrib.auth import get_user_model

    created = user_client.post(BASE, _payload(), format="json").json()

    other = get_user_model().objects.create_user(email="otra@example.test", password="x-clave-123")
    api_client.force_authenticate(user=other)

    assert api_client.get(BASE).json()["count"] == 0
    assert api_client.get(f"{BASE}{created['id']}/").status_code == 404


@pytest.mark.django_db
def test_archivar_y_desarchivar(user_client: APIClient) -> None:
    cid = user_client.post(BASE, _payload(), format="json").json()["id"]

    assert user_client.post(f"{BASE}{cid}/archive/").json()["is_archived"] is True
    assert user_client.get(BASE, {"is_archived": "false"}).json()["count"] == 0
    assert user_client.get(BASE, {"is_archived": "true"}).json()["count"] == 1

    assert user_client.post(f"{BASE}{cid}/unarchive/").json()["is_archived"] is False


@pytest.mark.django_db
def test_favorito_es_idempotente_y_reversible(user_client: APIClient, user: Any) -> None:
    cid = user_client.post(BASE, _payload(), format="json").json()["id"]

    user_client.post(f"{BASE}{cid}/favorite/")
    assert user_client.post(f"{BASE}{cid}/favorite/").json()["is_favorite"] is True
    assert Favorite.objects.filter(user=user, listing_id=cid).count() == 1

    assert user_client.post(f"{BASE}{cid}/unfavorite/").json()["is_favorite"] is False
    assert Favorite.objects.filter(user=user, listing_id=cid).count() == 0


@pytest.mark.django_db
def test_editar_actualiza_vehiculo_y_anuncio_a_la_vez(user_client: APIClient) -> None:
    cid = user_client.post(BASE, _payload(), format="json").json()["id"]

    response = user_client.patch(
        f"{BASE}{cid}/", {"make": "Cupra", "price_cash": "17000.00"}, format="json"
    )

    assert response.status_code == 200, response.content
    body = response.json()
    assert body["make"] == "Cupra"
    assert body["price_cash"] == "17000.00"
    assert Listing.objects.get(pk=cid).vehicle.make == "Cupra"


@pytest.mark.django_db
def test_eliminar_borra_el_vehiculo_huerfano(user_client: APIClient) -> None:
    cid = user_client.post(BASE, _payload(), format="json").json()["id"]
    vehicle_id = Listing.objects.get(pk=cid).vehicle_id

    assert user_client.delete(f"{BASE}{cid}/").status_code == 204
    assert not Listing.objects.filter(pk=cid).exists()
    assert not Vehicle.objects.filter(pk=vehicle_id).exists()


@pytest.mark.django_db
def test_anonimo_no_puede_listar(api_client: APIClient) -> None:
    assert api_client.get(BASE).status_code in (401, 403)


# --- FASE 4: estados de seguimiento y filtros del dashboard --------------------------


@pytest.mark.django_db
def test_estado_seguimiento_por_defecto_es_nuevo(user_client: APIClient) -> None:
    body = user_client.post(BASE, _payload(), format="json").json()
    assert body["tracking_status"] == "nuevo"
    assert body["source"] == "manual"
    # El Car Score (FASE 7) se calcula al crear el candidato.
    assert isinstance(body["score"], int)


@pytest.mark.django_db
def test_cambiar_estado_seguimiento(user_client: APIClient) -> None:
    cid = user_client.post(BASE, _payload(), format="json").json()["id"]

    response = user_client.patch(f"{BASE}{cid}/", {"tracking_status": "visita"}, format="json")

    assert response.status_code == 200, response.content
    assert response.json()["tracking_status"] == "visita"
    assert Listing.objects.get(pk=cid).tracking_status == "visita"


@pytest.mark.django_db
def test_filtrar_por_estado_de_seguimiento(user_client: APIClient) -> None:
    user_client.post(BASE, _payload(), format="json")
    cid = user_client.post(BASE, _payload(make="Kia"), format="json").json()["id"]
    user_client.patch(f"{BASE}{cid}/", {"tracking_status": "visita"}, format="json")

    data = user_client.get(BASE, {"tracking_status": "visita"}).json()
    assert data["count"] == 1
    assert data["results"][0]["id"] == cid


@pytest.mark.django_db
def test_filtrar_por_precio_y_anio(user_client: APIClient) -> None:
    user_client.post(BASE, _payload(price_cash="12000.00", year=2018), format="json")
    user_client.post(BASE, _payload(price_cash="25000.00", year=2023), format="json")

    data = user_client.get(BASE, {"price_max": "20000", "year_min": "2015"}).json()
    assert data["count"] == 1
    assert data["results"][0]["price_cash"] == "12000.00"


@pytest.mark.django_db
def test_filtrar_por_favorito(user_client: APIClient) -> None:
    fav_id = user_client.post(BASE, _payload(), format="json").json()["id"]
    user_client.post(BASE, _payload(make="Kia"), format="json")
    user_client.post(f"{BASE}{fav_id}/favorite/")

    data = user_client.get(BASE, {"is_favorite": "true"}).json()
    assert data["count"] == 1
    assert data["results"][0]["id"] == fav_id
