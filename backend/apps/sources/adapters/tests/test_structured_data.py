"""Parser del adaptador de datos estructurados (FASE 8). Puro: fixtures HTML, sin red."""

from decimal import Decimal
from pathlib import Path

import pytest

from apps.sources.adapters.errors import UnparseableListing
from apps.sources.adapters.structured_data import StructuredDataAdapter

FIXTURES = Path(__file__).parent / "fixtures"


def _html(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


@pytest.fixture
def adapter() -> StructuredDataAdapter:
    return StructuredDataAdapter()


def test_lee_un_coche_de_json_ld(adapter: StructuredDataAdapter) -> None:
    raw = adapter.parse(_html("coche_jsonld.html"), "https://example.test/golf")

    assert raw.make == "Volkswagen"
    assert raw.model == "Golf"
    assert raw.version == "1.5 TSI Life"
    assert raw.year == 2021
    assert raw.fuel_type == "gasolina"
    assert raw.mileage_km == 48200
    assert raw.power_cv == 131  # 96 kW convertidos a CV
    assert raw.fuel_consumption == Decimal("5.4")
    assert raw.price_cash == Decimal("18990.00")
    assert raw.seller_name == "Concesionario Ejemplo"
    assert raw.location == "Sevilla"
    assert raw.warnings == []


def test_payload_para_el_formulario(adapter: StructuredDataAdapter) -> None:
    raw = adapter.parse(_html("coche_jsonld.html"), "https://example.test/golf")
    payload = raw.to_candidate_payload()

    assert payload["make"] == "Volkswagen"
    assert payload["price_cash"] == "18990.00"
    assert payload["fuel_consumption"] == "5.4"
    assert payload["url"] == "https://example.test/golf"


def test_open_graph_como_apoyo(adapter: StructuredDataAdapter) -> None:
    raw = adapter.parse(_html("coche_opengraph.html"), "https://example.test/leon")

    assert raw.make == "SEAT"
    assert "León" in raw.model
    assert raw.fuel_type == "diesel"
    assert raw.price_cash == Decimal("15499")
    # El modelo se dedujo del título: debe avisar para que el usuario lo revise.
    assert any("modelo" in w.lower() for w in raw.warnings)


def test_pagina_sin_datos_estructurados(adapter: StructuredDataAdapter) -> None:
    with pytest.raises(UnparseableListing):
        adapter.parse(_html("sin_datos.html"), "https://example.test/nada")


def test_can_handle_solo_http(adapter: StructuredDataAdapter) -> None:
    assert adapter.can_handle("https://example.test/x")
    assert not adapter.can_handle("ftp://example.test/x")
