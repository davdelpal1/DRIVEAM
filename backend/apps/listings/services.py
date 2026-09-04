"""Casos de uso del alta manual de candidatos (FASE 3).

La pantalla "Nuevo candidato" mezcla campos de `Vehicle` (coche normalizado) y de `Listing`
(el anuncio concreto). Aquí se encapsula la transacción que crea/edita ambos —más el
`Seller` opcional y la `UserVehicleNote`— para que la vista quede fina. No es un CRUD de una
sola tabla, así que la capa de servicio está justificada (CLAUDE.md).
"""

from __future__ import annotations

from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.favorites.models import UserVehicleNote
from apps.listings.models import Listing
from apps.sources.enums import IntegrationType, SellerType
from apps.sources.models import Seller, Source
from apps.vehicles.models import Vehicle

_MANUAL_SOURCE_SLUG = "manual"
_IMPORT_SOURCE_SLUG = "datos-estructurados"

# Campos que viajan planos en el payload del candidato y a qué modelo pertenecen.
_VEHICLE_FIELDS = (
    "make",
    "model",
    "version",
    "fuel_type",
    "power_cv",
    "first_registration_year",
    "fuel_consumption",
)
_LISTING_FIELDS = (
    "mileage_km",
    "price_cash",
    "price_financed",
    "warranty_months",
    "city",
    "url",
    "tracking_status",
)


def get_manual_source() -> Source:
    """Fuente sintética a la que se adscriben los anuncios dados de alta a mano."""
    source, _ = Source.objects.get_or_create(
        slug=_MANUAL_SOURCE_SLUG,
        defaults={
            "name": "Entrada manual",
            "integration_type": IntegrationType.MANUAL,
        },
    )
    return source


def get_import_source() -> Source:
    """Fuente de los candidatos añadidos con la importación por URL (FASE 8)."""
    source, _ = Source.objects.get_or_create(
        slug=_IMPORT_SOURCE_SLUG,
        defaults={
            "name": "Datos estructurados (schema.org)",
            "integration_type": IntegrationType.USER_IMPORT,
        },
    )
    return source


def _split(data: dict[str, Any], fields: tuple[str, ...]) -> dict[str, Any]:
    return {key: data[key] for key in fields if key in data}


def _sync_seller(source: Source, name: str) -> Seller | None:
    name = (name or "").strip()
    if not name:
        return None
    seller, _ = Seller.objects.get_or_create(
        source=source,
        name=name,
        defaults={"type": SellerType.UNKNOWN},
    )
    return seller


def _recalculate_score(listing: Listing, owner: User) -> None:
    """Recalcula el Car Score del candidato tras crearlo o editarlo (import diferido)."""
    from apps.scoring.services import recalculate_score

    recalculate_score(listing=listing, user=owner)


def _sync_note(*, owner: User, listing: Listing, text: str | None) -> None:
    if text is None:
        return
    note = listing.notes.filter(user=owner).first()
    text = text.strip()
    if not text:
        if note is not None:
            note.delete()
        return
    if note is None:
        UserVehicleNote.objects.create(user=owner, listing=listing, text=text)
    elif note.text != text:
        note.text = text
        note.save(update_fields=["text"])


@transaction.atomic
def create_candidate(*, owner: User, data: dict[str, Any]) -> Listing:
    import_url = (data.get("import_url") or "").strip()
    source = get_import_source() if import_url else get_manual_source()
    if import_url and not data.get("url"):
        data = {**data, "url": import_url}
    raw_data = (
        {"import_url": import_url, "imported_at": timezone.now().isoformat()} if import_url else {}
    )
    vehicle = Vehicle.objects.create(**_split(data, _VEHICLE_FIELDS))
    listing = Listing.objects.create(
        owner=owner,
        vehicle=vehicle,
        source=source,
        seller=_sync_seller(source, data.get("seller_name", "")),
        raw_data=raw_data,
        **_split(data, _LISTING_FIELDS),
    )
    _sync_note(owner=owner, listing=listing, text=data.get("notes"))
    _recalculate_score(listing, owner)
    return listing


@transaction.atomic
def update_candidate(listing: Listing, data: dict[str, Any]) -> Listing:
    assert listing.owner is not None  # un candidato manual siempre tiene dueño
    vehicle_patch = _split(data, _VEHICLE_FIELDS)
    if vehicle_patch:
        for field, value in vehicle_patch.items():
            setattr(listing.vehicle, field, value)
        listing.vehicle.save(update_fields=list(vehicle_patch))

    listing_patch = _split(data, _LISTING_FIELDS)
    if "seller_name" in data:
        listing.seller = _sync_seller(get_manual_source(), data["seller_name"])
        listing_patch["seller"] = listing.seller
    for field, value in listing_patch.items():
        setattr(listing, field, value)
    if listing_patch:
        listing.save(update_fields=list(listing_patch))

    _sync_note(owner=listing.owner, listing=listing, text=data.get("notes"))
    _recalculate_score(listing, listing.owner)
    return listing


def delete_candidate(listing: Listing) -> None:
    """Borra el anuncio y su vehículo si queda huérfano (alta manual = 1 vehículo, 1 anuncio)."""
    vehicle = listing.vehicle
    with transaction.atomic():
        listing.delete()
        if not vehicle.listings.exists():
            vehicle.delete()
