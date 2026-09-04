"""`POST /api/v1/listings/import/` — importación por URL para revisión (FASE 8)."""

from pathlib import Path

import pytest
from rest_framework.test import APIClient

from apps.listings import api as listings_api
from apps.sources.adapters import import_listing
from apps.sources.adapters.errors import UnfetchableUrl
from apps.sources.models import Source

IMPORT = "/api/v1/listings/import/"
CANDIDATES = "/api/v1/candidates/"
FIXTURES = Path(__file__).parents[2] / "sources" / "adapters" / "tests" / "fixtures"


@pytest.fixture(autouse=True)
def _allow_private(settings) -> None:
    settings.IMPORT_ALLOW_PRIVATE_HOSTS = True


def _stub_fetch(monkeypatch: pytest.MonkeyPatch, html: str) -> None:
    monkeypatch.setattr(
        listings_api,
        "import_listing",
        lambda url: import_listing(url, fetcher=lambda _u: html),
    )


@pytest.mark.django_db
def test_importar_devuelve_candidato_para_revisar(
    user_client: APIClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _stub_fetch(monkeypatch, (FIXTURES / "coche_jsonld.html").read_text(encoding="utf-8"))

    res = user_client.post(IMPORT, {"url": "https://portal.test/golf"}, format="json")

    assert res.status_code == 200
    body = res.json()
    assert body["source"]["slug"] == "datos-estructurados"
    assert body["candidate"]["make"] == "Volkswagen"
    assert body["candidate"]["fuel_consumption"] == "5.4"
    assert body["candidate"]["import_url"] == "https://portal.test/golf"
    # No se ha persistido nada todavía.
    assert not Source.objects.filter(slug="datos-estructurados").exists()


@pytest.mark.django_db
def test_guardar_el_candidato_importado_fija_la_fuente(
    user_client: APIClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _stub_fetch(monkeypatch, (FIXTURES / "coche_jsonld.html").read_text(encoding="utf-8"))
    preview = user_client.post(IMPORT, {"url": "https://portal.test/golf"}, format="json").json()[
        "candidate"
    ]

    created = user_client.post(CANDIDATES, preview, format="json")
    assert created.status_code == 201
    row = created.json()
    assert row["source"] == "datos-estructurados"
    assert row["url"] == "https://portal.test/golf"
    assert row["fuel_consumption"] == "5.4"
    assert isinstance(row["score"], int)  # el Car Score usa ya el consumo


@pytest.mark.django_db
def test_url_no_valida(user_client: APIClient) -> None:
    res = user_client.post(IMPORT, {"url": "ftp://portal.test/x"}, format="json")
    assert res.status_code == 400
    assert res.json()["code"] == "unsafe_url"


@pytest.mark.django_db
def test_error_de_descarga_es_estructurado(
    user_client: APIClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def boom(url: str):
        raise UnfetchableUrl("No se pudo conectar con la página.")

    monkeypatch.setattr(listings_api, "import_listing", boom)
    res = user_client.post(IMPORT, {"url": "https://portal.test/x"}, format="json")
    assert res.status_code == 502
    assert res.json() == {
        "code": "unfetchable_url",
        "detail": "No se pudo conectar con la página.",
    }


@pytest.mark.django_db
def test_requiere_autenticacion(api_client: APIClient) -> None:
    assert api_client.post(IMPORT, {"url": "https://portal.test/x"}, format="json").status_code in (
        401,
        403,
    )
