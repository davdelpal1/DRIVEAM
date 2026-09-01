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
