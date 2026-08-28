"""Fixtures compartidas por toda la suite de tests del backend."""

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()
