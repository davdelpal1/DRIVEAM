"""Adaptador de datos estructurados genéricos (FASE 8, primera fuente).

No apunta a ningún portal concreto: lee los **datos estructurados que la propia página
publica** para buscadores — JSON-LD de schema.org (`Vehicle` / `Car` / `Product`) y, como
apoyo, etiquetas Open Graph. Es la opción legalmente más conservadora para la fase de prueba
(uso personal, datos que el usuario ya está viendo, sin republicación). Ver
`docs/data-sources/datos-estructurados.md` y `docs/decisions/0013-importacion-por-url.md`.

`parse()` es pura: recibe el HTML ya descargado y no toca la red (los tests usan fixtures en
`tests/fixtures/`).
"""

from __future__ import annotations

import html as html_module
import json
import re
from datetime import date
from typing import Any

from apps.sources.adapters.base import RawListing, SourceAdapter
from apps.sources.adapters.errors import UnparseableListing
from apps.sources.adapters.normalize import (
    consumption_from,
    fuel_type_from,
    power_cv_from,
    to_decimal,
    to_positive_int,
    year_from,
)
from apps.sources.enums import IntegrationType

_JSONLD_RE = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.DOTALL | re.IGNORECASE,
)
_META_RE = re.compile(r"<meta\b[^>]*>", re.IGNORECASE)
_ATTR_RE = re.compile(r'(\w[\w:-]*)\s*=\s*"([^"]*)"', re.IGNORECASE)
_VEHICLE_TYPES = {"vehicle", "car", "motorcycle", "product", "individualproduct"}


def _iter_nodes(data: Any) -> list[dict[str, Any]]:
    """Aplana un documento JSON-LD (listas y `@graph` incluidos) a una lista de nodos."""
    out: list[dict[str, Any]] = []
    stack = [data]
    while stack:
        item = stack.pop()
        if isinstance(item, list):
            stack.extend(item)
        elif isinstance(item, dict):
            out.append(item)
            if isinstance(item.get("@graph"), list):
                stack.extend(item["@graph"])
    return out


def _type_matches(node: dict[str, Any]) -> bool:
    raw = node.get("@type", "")
    types = raw if isinstance(raw, list) else [raw]
    return any(str(t).split("/")[-1].lower() in _VEHICLE_TYPES for t in types)


def _jsonld_nodes(document: str) -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []
    for block in _JSONLD_RE.findall(document):
        text = html_module.unescape(block).strip()
        try:
            nodes.extend(_iter_nodes(json.loads(text)))
        except (json.JSONDecodeError, ValueError):
            continue
    return nodes


def _meta_tags(document: str) -> dict[str, str]:
    tags: dict[str, str] = {}
    for match in _META_RE.findall(document):
        attrs = {k.lower(): html_module.unescape(v) for k, v in _ATTR_RE.findall(match)}
        key = attrs.get("property") or attrs.get("name")
        if key and "content" in attrs:
            tags.setdefault(key.lower(), attrs["content"])
    return tags


def _text(value: Any) -> str:
    if isinstance(value, dict):
        return str(value.get("name") or value.get("@value") or "").strip()
    if isinstance(value, list):
        return _text(value[0]) if value else ""
    return str(value or "").strip()


def _qv(value: Any) -> tuple[Any, str]:
    """Devuelve (valor, unidad) de un `QuantitativeValue` de schema.org o de un escalar."""
    if isinstance(value, dict):
        return value.get("value"), _text(value.get("unitCode") or value.get("unitText"))
    if isinstance(value, list) and value:
        return _qv(value[0])
    return value, ""


def _offer(node: dict[str, Any]) -> dict[str, Any]:
    offers = node.get("offers")
    if isinstance(offers, list):
        offers = offers[0] if offers else None
    return offers if isinstance(offers, dict) else {}


class StructuredDataAdapter(SourceAdapter):
    slug = "datos-estructurados"
    source_defaults = {
        "name": "Datos estructurados (schema.org)",
        "integration_type": IntegrationType.USER_IMPORT,
        "commercial_use_allowed": False,
        "images_allowed": False,
        "refresh_policy": "manual",
    }

    def can_handle(self, url: str) -> bool:
        # Fuente por defecto: cualquier enlace http(s) se intenta leer por datos estructurados.
        return url.lower().startswith(("http://", "https://"))

    def parse(self, document: str, url: str) -> RawListing:
        nodes = _jsonld_nodes(document)
        vehicle = next((n for n in nodes if _type_matches(n)), None)
        meta = _meta_tags(document)

        if vehicle is None and not meta:
            raise UnparseableListing(
                "La página no publica datos estructurados de un vehículo (JSON-LD / Open Graph)."
            )

        vehicle = vehicle or {}
        offer = _offer(vehicle)
        raw: dict[str, Any] = {}
        warnings: list[str] = []

        make = _text(vehicle.get("brand") or vehicle.get("manufacturer") or meta.get("og:brand"))
        model = _text(vehicle.get("model"))
        version = _text(vehicle.get("vehicleConfiguration") or vehicle.get("trim"))

        title = _text(vehicle.get("name")) or meta.get("og:title", "")
        description = _text(vehicle.get("description")) or meta.get("og:description", "")

        if not model and title:
            # Sin `model` estructurado: se usa el título y el usuario lo ajusta en la revisión.
            derived = title
            if make and derived.lower().startswith(make.lower()):
                derived = derived[len(make) :].strip(" -·,")
            model = derived
            warnings.append("El modelo se ha deducido del título del anuncio; revísalo.")

        year_raw = (
            vehicle.get("dateVehicleFirstRegistered")
            or vehicle.get("vehicleModelDate")
            or vehicle.get("modelDate")
            or vehicle.get("productionDate")
            or vehicle.get("releaseDate")
        )
        raw["year"] = year_raw
        year = year_from(year_raw)

        mileage_value, mileage_unit = _qv(vehicle.get("mileageFromOdometer"))
        raw["mileage"] = {"value": mileage_value, "unit": mileage_unit}
        mileage_km = to_positive_int(mileage_value)
        if mileage_km is not None and "SMI" in (mileage_unit or "").upper():
            mileage_km = int(mileage_km * 1.60934)
            warnings.append("El kilometraje venía en millas; convertido a kilómetros.")

        power_value, power_unit = _qv(
            vehicle.get("vehicleEngine", {}).get("enginePower")
            if isinstance(vehicle.get("vehicleEngine"), dict)
            else vehicle.get("enginePower")
        )
        raw["power"] = {"value": power_value, "unit": power_unit}
        power_cv = power_cv_from(power_value, power_unit)

        fuel_raw = vehicle.get("fuelType") or meta.get("og:fuel_type")
        raw["fuel_type"] = fuel_raw
        fuel_type = fuel_type_from(fuel_raw)

        consumption_value, _ = _qv(vehicle.get("fuelConsumption") or vehicle.get("fuelEfficiency"))
        raw["fuel_consumption"] = consumption_value
        fuel_consumption = consumption_from(consumption_value)

        price_raw = (
            offer.get("price")
            or (offer.get("priceSpecification") or {}).get("price")
            or meta.get("product:price:amount")
            or meta.get("og:price:amount")
        )
        currency = _text(
            offer.get("priceCurrency")
            or (offer.get("priceSpecification") or {}).get("priceCurrency")
            or meta.get("product:price:currency")
        )
        raw["price"] = {"value": price_raw, "currency": currency}
        price_cash = to_decimal(price_raw)
        if price_cash is not None and currency and currency.upper() not in {"EUR", "€", ""}:
            warnings.append(f"El precio está en {currency}, no en euros; revísalo.")

        seller = offer.get("seller") or vehicle.get("seller") or {}
        seller_name = _text(seller)
        address = seller.get("address") if isinstance(seller, dict) else None
        if isinstance(address, dict):
            location = _text(address.get("addressLocality") or address.get("addressRegion"))
        else:
            location = _text(address) or _text(vehicle.get("location"))

        listing = RawListing(
            source_url=url,
            make=make,
            model=model,
            version=version,
            fuel_type=fuel_type or "desconocido",
            power_cv=power_cv,
            year=year,
            fuel_consumption=fuel_consumption,
            mileage_km=mileage_km,
            price_cash=price_cash,
            seller_name=seller_name,
            location=location,
            title=title,
            description=description[:2000],
            raw={k: v for k, v in raw.items() if v not in (None, "", {}, [])},
            warnings=warnings,
        )

        if not listing.has_minimum_data():
            raise UnparseableListing(
                "Se encontraron datos estructurados, pero sin marca y modelo del coche."
            )
        if year is not None and year > date.today().year + 1:
            listing.warnings.append("El año detectado parece incorrecto; compruébalo.")
        return listing
