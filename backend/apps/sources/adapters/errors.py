"""Errores estructurados de la importación por URL (FASE 8).

Cada error lleva un `code` estable (para que el frontend reaccione sin parsear textos) y un
`detail` en español para mostrar al usuario. La vista los traduce a un 4xx con el cuerpo
`{"code": ..., "detail": ...}`.
"""

from __future__ import annotations


class ImportError(Exception):
    """Base de los fallos de importación. `status_code` lo usa la vista de la API."""

    code = "import_error"
    status_code = 400

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or self.__class__.__doc__ or "No se pudo importar el anuncio."
        super().__init__(self.detail)


class UnsafeUrl(ImportError):
    """La URL no es válida o apunta a un recurso no permitido."""

    code = "unsafe_url"
    status_code = 400


class SourceNotSupported(ImportError):
    """Ninguna fuente configurada sabe leer esta URL."""

    code = "source_not_supported"
    status_code = 422


class UnfetchableUrl(ImportError):
    """No se pudo descargar la página (error de red, tiempo agotado o respuesta no válida)."""

    code = "unfetchable_url"
    status_code = 502


class UnparseableListing(ImportError):
    """Se descargó la página pero no contiene datos de un vehículo reconocibles."""

    code = "unparseable_listing"
    status_code = 422
