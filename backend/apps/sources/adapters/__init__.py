"""Patrón Source Adapter (FASE 8).

Cada fuente de datos (entrada manual, importación por URL, API, feed, scraper) implementa
`SourceAdapter` y se registra en `registry`. El resto de la aplicación **no sabe** cómo se
obtuvo un anuncio (ARCHITECTURE.md §7 y §27.3): solo pide `import_listing(url)` y recibe un
`RawListing` normalizado listo para revisión.

Pipeline de esta fase (subconjunto del de ARCHITECTURE.md §8):

    URL -> validación + SSRF -> fetch -> SourceAdapter.parse -> RawListing -> revisión -> guardar
"""

from apps.sources.adapters.base import RawListing, SourceAdapter
from apps.sources.adapters.errors import (
    ImportError as ListingImportError,
)
from apps.sources.adapters.errors import (
    SourceNotSupported,
    UnfetchableUrl,
    UnparseableListing,
    UnsafeUrl,
)
from apps.sources.adapters.registry import find_adapter, import_listing, registry

__all__ = [
    "ListingImportError",
    "RawListing",
    "SourceAdapter",
    "SourceNotSupported",
    "UnfetchableUrl",
    "UnparseableListing",
    "UnsafeUrl",
    "find_adapter",
    "import_listing",
    "registry",
]
