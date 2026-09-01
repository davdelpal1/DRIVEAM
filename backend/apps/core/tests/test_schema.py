import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_el_esquema_incluye_los_recursos_del_dominio(api_client: APIClient) -> None:
    response = api_client.get("/api/v1/schema/")

    assert response.status_code == 200
    content = response.content.decode()
    for path in (
        "/api/v1/vehicles/",
        "/api/v1/listings/",
        "/api/v1/sources/",
        "/api/v1/sellers/",
        "/api/v1/auth/login/",
        "/api/v1/auth/register/",
        "/api/v1/preferences/",
    ):
        assert path in content
