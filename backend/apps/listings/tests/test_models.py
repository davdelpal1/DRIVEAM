from decimal import Decimal

import pytest
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError

from apps.listings.enums import ListingStatus
from apps.listings.models import Listing
from apps.sources.models import Source
from apps.vehicles.models import Vehicle


@pytest.fixture
def source(db: None) -> Source:
    return Source.objects.create(name="Portal X", slug="portal-x")


@pytest.fixture
def vehicle(db: None) -> Vehicle:
    return Vehicle.objects.create(make="Seat", model="León")


@pytest.mark.django_db
def test_anuncio_enlaza_vehiculo_y_fuente(source: Source, vehicle: Vehicle) -> None:
    listing = Listing.objects.create(
        source=source,
        vehicle=vehicle,
        url="https://ejemplo.test/1",
        price_cash=Decimal("10500.00"),
    )
    assert listing.status == ListingStatus.ACTIVE
    assert listing in vehicle.listings.all()
    assert listing in source.listings.all()


@pytest.mark.django_db
def test_un_vehiculo_puede_tener_varios_anuncios(source: Source, vehicle: Vehicle) -> None:
    Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/1")
    Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/2")
    assert vehicle.listings.count() == 2


@pytest.mark.django_db
def test_external_id_unico_por_fuente(source: Source, vehicle: Vehicle) -> None:
    Listing.objects.create(
        source=source, vehicle=vehicle, url="https://ejemplo.test/1", external_id="abc"
    )
    with pytest.raises(IntegrityError), transaction.atomic():
        Listing.objects.create(
            source=source, vehicle=vehicle, url="https://ejemplo.test/2", external_id="abc"
        )


@pytest.mark.django_db
def test_external_id_vacio_no_colisiona(source: Source, vehicle: Vehicle) -> None:
    Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/1")
    Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/2")
    assert source.listings.count() == 2


@pytest.mark.django_db
def test_no_se_puede_borrar_un_vehiculo_con_anuncios(source: Source, vehicle: Vehicle) -> None:
    Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/1")
    with pytest.raises(ProtectedError):
        vehicle.delete()


@pytest.mark.django_db
def test_snapshot_pertenece_al_anuncio(source: Source, vehicle: Vehicle) -> None:
    listing = Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/1")
    listing.snapshots.create(price_cash=Decimal("10500.00"), status=ListingStatus.ACTIVE)
    assert listing.snapshots.count() == 1
