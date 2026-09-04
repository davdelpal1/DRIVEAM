"""Prevención de SSRF de la importación por URL (FASE 8, obligatoria)."""

import socket

import pytest

from apps.sources.adapters import ssrf
from apps.sources.adapters.errors import UnsafeUrl


@pytest.fixture(autouse=True)
def _enforce(settings) -> None:
    settings.IMPORT_ALLOW_PRIVATE_HOSTS = False


def _resolve_to(monkeypatch: pytest.MonkeyPatch, ip: str) -> None:
    def fake_getaddrinfo(host, *args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 0, "", (ip, 0))]

    monkeypatch.setattr(ssrf.socket, "getaddrinfo", fake_getaddrinfo)


def test_acepta_host_publico(monkeypatch: pytest.MonkeyPatch) -> None:
    _resolve_to(monkeypatch, "93.184.216.34")
    assert ssrf.validate_public_url("https://example.test/coche") == "https://example.test/coche"


@pytest.mark.parametrize(
    "url",
    [
        "http://localhost/x",
        "http://127.0.0.1/x",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.5/x",
        "http://192.168.1.1/x",
        "http://[::1]/x",
        "file:///etc/passwd",
        "ftp://example.test/x",
        "https://user:pass@example.test/x",
    ],
)
def test_rechaza_urls_peligrosas(url: str, monkeypatch: pytest.MonkeyPatch) -> None:
    # Aunque el DNS resolviese a algo público, las IP/esquemas prohibidos se rechazan antes.
    _resolve_to(monkeypatch, "10.1.2.3")
    with pytest.raises(UnsafeUrl):
        ssrf.validate_public_url(url)


def test_rechaza_dominio_que_resuelve_a_ip_interna(monkeypatch: pytest.MonkeyPatch) -> None:
    _resolve_to(monkeypatch, "192.168.0.10")
    with pytest.raises(UnsafeUrl):
        ssrf.validate_public_url("https://rebind.example.test/x")


def test_bypass_para_desarrollo(settings) -> None:
    settings.IMPORT_ALLOW_PRIVATE_HOSTS = True
    assert ssrf.validate_public_url("http://backend:8000/fixture") == "http://backend:8000/fixture"
