"""Fixtures compartidas por toda la suite de tests del backend."""

from collections.abc import Iterator
from typing import Any

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _clear_cache() -> Iterator[None]:
    """Aísla el estado de throttling (vive en la caché) entre tests."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def user(db: None) -> Any:
    """Usuario normal (sin permisos de staff)."""
    return get_user_model().objects.create_user(
        email="usuario@example.test", password="clave-de-prueba-123"
    )


@pytest.fixture
def user_client(user: Any) -> APIClient:
    """Cliente de API autenticado como un usuario normal."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def authenticated_client(admin_user: Any) -> APIClient:
    """Cliente de API con sesión de superusuario.

    Las escrituras del catálogo requieren un usuario autenticado; `admin_user` lo aporta
    pytest-django (con `USERNAME_FIELD = "email"` usa `admin@example.com`).
    """
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client
