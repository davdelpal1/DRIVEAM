"""Registro de adaptadores y orquestación `import_listing` (FASE 8)."""

from pathlib import Path

import pytest

from apps.sources.adapters import find_adapter, import_listing
from apps.sources.adapters.errors import UnsafeUrl
from apps.sources.adapters.structured_data import StructuredDataAdapter

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(autouse=True)
def _allow_private(settings) -> None:
    settings.IMPORT_ALLOW_PRIVATE_HOSTS = True


def test_el_generico_maneja_cualquier_http() -> None:
    assert isinstance(find_adapter("https://portal.test/anuncio/123"), StructuredDataAdapter)


def test_import_listing_end_to_end() -> None:
    html = (FIXTURES / "coche_jsonld.html").read_text(encoding="utf-8")
    adapter, raw = import_listing("https://portal.test/golf", fetcher=lambda _url: html)

    assert adapter.slug == "datos-estructurados"
    assert raw.make == "Volkswagen"
    assert raw.to_candidate_payload()["url"] == "https://portal.test/golf"


def test_import_listing_valida_la_url_antes_de_descargar() -> None:
    called = False

    def fetcher(_url: str) -> str:
        nonlocal called
        called = True
        return ""

    with pytest.raises(UnsafeUrl):
        import_listing("ftp://portal.test/x", fetcher=fetcher)
    assert not called
