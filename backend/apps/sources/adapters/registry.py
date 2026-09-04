"""Registro de adaptadores y orquestación de la importación (FASE 8).

`registry` mantiene la lista ordenada de `SourceAdapter`. `find_adapter(url)` devuelve el
primero que dice saber leer la URL (los específicos van antes que el genérico).
`import_listing(url)` es el punto de entrada del caso de uso: valida, descarga, parsea y
devuelve un `RawListing` para revisión — **sin persistir nada**.
"""

from __future__ import annotations

from collections.abc import Callable

from apps.sources.adapters.base import RawListing, SourceAdapter
from apps.sources.adapters.errors import SourceNotSupported
from apps.sources.adapters.fetch import fetch_document
from apps.sources.adapters.ssrf import validate_public_url
from apps.sources.adapters.structured_data import StructuredDataAdapter


class AdapterRegistry:
    def __init__(self) -> None:
        self._adapters: list[SourceAdapter] = []

    def register(self, adapter: SourceAdapter) -> None:
        self._adapters.append(adapter)

    def all(self) -> list[SourceAdapter]:
        return list(self._adapters)

    def find(self, url: str) -> SourceAdapter | None:
        return next((a for a in self._adapters if a.can_handle(url)), None)


registry = AdapterRegistry()
# El genérico de datos estructurados es el último recurso: se registra al final.
registry.register(StructuredDataAdapter())


def find_adapter(url: str) -> SourceAdapter | None:
    return registry.find(url)


def import_listing(
    url: str, *, fetcher: Callable[[str], str] = fetch_document
) -> tuple[SourceAdapter, RawListing]:
    """Valida + descarga + parsea la URL. `fetcher` es inyectable para los tests."""
    url = validate_public_url(url)
    adapter = registry.find(url)
    if adapter is None:
        raise SourceNotSupported("Ninguna fuente configurada sabe importar este enlace.")
    document = fetcher(url)
    return adapter, adapter.parse(document, url)
