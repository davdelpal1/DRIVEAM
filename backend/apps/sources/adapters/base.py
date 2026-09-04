"""Contrato del patrón Source Adapter (FASE 8).

`SourceAdapter` es la única interfaz que el resto de la aplicación conoce de una fuente:

- `slug` / `source_defaults`: identidad de la fuente (para crear/actualizar el `Source`).
- `can_handle(url)`: ¿esta fuente sabe leer esta URL?
- `parse(document, url)`: HTML/JSON ya descargado -> `RawListing` normalizado. **Función pura**
  (sin red), para poder testearla con fixtures.

`RawListing` conserva el valor normalizado de cada campo y, en `raw`, el original tal cual
venía en la página (ARCHITECTURE.md §9). `warnings` recoge avisos no bloqueantes para
mostrar en la pantalla de revisión.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

_UNKNOWN_FUEL = "desconocido"  # apps.vehicles.enums.FuelType.UNKNOWN

# Campos del vehículo normalizado que puede traer una importación.
_VEHICLE_KEYS = ("make", "model", "version", "fuel_type", "power_cv", "year", "fuel_consumption")
# Campos del anuncio que van al formulario de alta de candidato.
_LISTING_KEYS = (
    "mileage_km",
    "price_cash",
    "price_financed",
    "seller_name",
    "warranty_months",
    "location",
)


@dataclass(frozen=True)
class RawListing:
    """Datos de un anuncio importados de una fuente, listos para revisión (no persistidos)."""

    source_url: str
    make: str = ""
    model: str = ""
    version: str = ""
    fuel_type: str = _UNKNOWN_FUEL
    power_cv: int | None = None
    year: int | None = None
    fuel_consumption: Decimal | None = None
    mileage_km: int | None = None
    price_cash: Decimal | None = None
    price_financed: Decimal | None = None
    seller_name: str = ""
    warranty_months: int | None = None
    location: str = ""
    title: str = ""
    description: str = ""
    raw: dict[str, Any] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)

    def has_minimum_data(self) -> bool:
        """Marca y modelo son el mínimo para dar de alta un candidato (igual que el alta manual)."""
        return bool(self.make.strip() and self.model.strip())

    def to_candidate_payload(self) -> dict[str, Any]:
        """Forma que espera `CandidateSerializer` (claves de formulario: `year`, `location`…)."""
        payload: dict[str, Any] = {}
        for key in (*_VEHICLE_KEYS, *_LISTING_KEYS):
            value = getattr(self, key)
            if key in ("make", "model"):
                payload[key] = value
            elif isinstance(value, str):
                if value:
                    payload[key] = value
            elif value is not None:
                payload[key] = value
        if self.price_cash is not None:
            payload["price_cash"] = f"{self.price_cash:.2f}"
        if self.price_financed is not None:
            payload["price_financed"] = f"{self.price_financed:.2f}"
        if self.fuel_consumption is not None:
            payload["fuel_consumption"] = f"{self.fuel_consumption:.1f}"
        payload["url"] = self.source_url
        return payload


class SourceAdapter(ABC):
    """Interfaz común a todas las fuentes (ARCHITECTURE.md §7)."""

    #: identificador estable de la fuente (slug del `Source`).
    slug: str
    #: valores por defecto para crear/actualizar el `Source` asociado.
    source_defaults: dict[str, Any] = {}

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """¿Esta fuente sabe leer esta URL?"""

    @abstractmethod
    def parse(self, document: str, url: str) -> RawListing:
        """Documento ya descargado -> `RawListing`. Pura: no hace peticiones de red."""
