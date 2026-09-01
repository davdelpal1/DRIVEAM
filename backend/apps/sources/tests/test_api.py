import pytest
from rest_framework.test import APIClient

from apps.sources.models import Source


@pytest.mark.django_db
def test_listado_de_fuentes_es_publico(api_client: APIClient) -> None:
    Source.objects.create(name="Portal X", slug="portal-x")
    response = api_client.get("/api/v1/sources/")

    assert response.status_code == 200
    assert response.json()["count"] == 1


@pytest.mark.django_db
def test_anonimo_no_puede_crear_fuente(api_client: APIClient) -> None:
    response = api_client.post("/api/v1/sources/", {"name": "Y", "slug": "y"})

    assert response.status_code in (401, 403)
    assert Source.objects.count() == 0


@pytest.mark.django_db
def test_usuario_normal_no_puede_crear_fuente(user_client: APIClient) -> None:
    # `Source` es configuración del sistema: solo el personal la escribe (ADR 0007).
    response = user_client.post("/api/v1/sources/", {"name": "Y", "slug": "y"})

    assert response.status_code == 403
    assert Source.objects.count() == 0


@pytest.mark.django_db
def test_admin_puede_crear_fuente(authenticated_client: APIClient) -> None:
    response = authenticated_client.post(
        "/api/v1/sources/", {"name": "Portal Y", "slug": "portal-y"}
    )

    assert response.status_code == 201, response.content
    assert Source.objects.filter(slug="portal-y").exists()
