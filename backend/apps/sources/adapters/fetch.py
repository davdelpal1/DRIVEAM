"""Descarga del documento a importar (FASE 8).

Aislado del parseo para poder simularlo en los tests (el parseo se prueba con fixtures HTML;
aquí solo la red). Cada salto de redirección se vuelve a validar con `validate_public_url`, de
modo que un `301` a `http://169.254.169.254/…` se rechaza. Límites: tiempo de espera, tamaño
máximo de respuesta y `Content-Type` de tipo HTML.
"""

from __future__ import annotations

import urllib.error
import urllib.parse
import urllib.request

from apps.sources.adapters.errors import UnfetchableUrl
from apps.sources.adapters.ssrf import validate_public_url

_TIMEOUT_SECONDS = 10
_MAX_BYTES = 3 * 1024 * 1024
_MAX_REDIRECTS = 4
_USER_AGENT = "DriveamBot/1.0 (+importación personal de anuncios)"
_HTML_HINTS = ("text/html", "application/xhtml", "text/plain")


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args: object, **kwargs: object) -> None:
        return None


_opener = urllib.request.build_opener(_NoRedirect)


def fetch_document(url: str) -> str:
    """Descarga la URL (validada) y devuelve su cuerpo como texto. Sigue redirecciones seguras."""
    current = validate_public_url(url)

    for _ in range(_MAX_REDIRECTS + 1):
        request = urllib.request.Request(
            current, headers={"User-Agent": _USER_AGENT, "Accept": "text/html,*/*;q=0.8"}
        )
        try:
            response = _opener.open(request, timeout=_TIMEOUT_SECONDS)
        except urllib.error.HTTPError as exc:
            if exc.status in (301, 302, 303, 307, 308):
                location = exc.headers.get("Location")
                if not location:
                    raise UnfetchableUrl("Redirección sin destino.") from exc
                current = validate_public_url(urllib.parse.urljoin(current, location))
                continue
            raise UnfetchableUrl(f"La página respondió con el error {exc.status}.") from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise UnfetchableUrl("No se pudo conectar con la página.") from exc

        with response:
            content_type = response.headers.get("Content-Type", "").lower()
            if content_type and not any(hint in content_type for hint in _HTML_HINTS):
                raise UnfetchableUrl("El enlace no apunta a una página web.")
            body = response.read(_MAX_BYTES + 1)
        if len(body) > _MAX_BYTES:
            raise UnfetchableUrl("La página es demasiado grande para importarla.")
        charset = response.headers.get_content_charset() or "utf-8"
        try:
            return body.decode(charset, errors="replace")
        except LookupError:
            return body.decode("utf-8", errors="replace")

    raise UnfetchableUrl("Demasiadas redirecciones.")
