"""Prevención de SSRF para la importación por URL (FASE 8, obligatoria — CLAUDE.md /
ARCHITECTURE.md §14).

`validate_public_url` acepta solo `http(s)://` hacia un host que resuelve **exclusivamente** a
direcciones IP públicas. Rechaza IPs privadas, loopback, link-local (incluida la de metadatos
de la nube `169.254.169.254`), reservadas y multicast, tanto si aparecen literalmente en la URL
como si son el resultado de resolver el DNS.

`settings.IMPORT_ALLOW_PRIVATE_HOSTS = True` desactiva la comprobación de rango de IP (solo
para desarrollo y la suite E2E, que apuntan a un servidor de fixtures local).
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlsplit

from django.conf import settings

from apps.sources.adapters.errors import UnsafeUrl

_ALLOWED_SCHEMES = {"http", "https"}
_ALLOWED_PORTS = {None, 80, 443, 8000}
_MAX_URL_LENGTH = 2000


def _ip_is_public(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return not (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    )


def _resolved_ips(host: str) -> list[str]:
    try:
        infos = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise UnsafeUrl(f"No se pudo resolver el dominio «{host}».") from exc
    return sorted({str(info[4][0]) for info in infos})


def validate_public_url(url: str) -> str:
    """Devuelve la URL si es segura de descargar; si no, lanza `UnsafeUrl`."""
    url = (url or "").strip()
    if not url or len(url) > _MAX_URL_LENGTH:
        raise UnsafeUrl("La URL está vacía o es demasiado larga.")

    parts = urlsplit(url)
    if parts.scheme.lower() not in _ALLOWED_SCHEMES:
        raise UnsafeUrl("Solo se admiten enlaces http:// o https://.")
    if "@" in parts.netloc:
        raise UnsafeUrl("La URL no puede incluir credenciales.")

    host = parts.hostname
    if not host:
        raise UnsafeUrl("La URL no tiene un dominio válido.")
    try:
        port = parts.port
    except ValueError as exc:
        raise UnsafeUrl("El puerto de la URL no es válido.") from exc
    if port not in _ALLOWED_PORTS:
        raise UnsafeUrl("Ese puerto no está permitido para la importación.")

    if getattr(settings, "IMPORT_ALLOW_PRIVATE_HOSTS", False):
        return url

    if host.lower() == "localhost" or host.lower().endswith(".local"):
        raise UnsafeUrl("No se pueden importar direcciones de red local.")

    ips = _resolved_ips(host)
    if not ips or not all(_ip_is_public(ip) for ip in ips):
        raise UnsafeUrl("El dominio apunta a una dirección de red interna.")
    return url
