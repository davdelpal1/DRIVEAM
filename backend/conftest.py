"""Fixtures compartidas por toda la suite de tests del backend."""

from typing import Any

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def authenticated_client(admin_user: Any) -> APIClient:
    """Cliente de API con sesión iniciada.

    Mientras no exista autenticación real (FASE 2), las escrituras del catálogo requieren un
    usuario autenticado; `admin_user` lo aporta pytest-django.
    """
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client
