from decimal import Decimal

import pytest

from apps.finance.models import FinanceOffer
from apps.listings.models import Listing
from apps.sources.models import Source
from apps.vehicles.models import Vehicle


@pytest.mark.django_db
def test_oferta_conserva_decimales_sin_redondeo() -> None:
    source = Source.objects.create(name="Portal X", slug="portal-x")
    vehicle = Vehicle.objects.create(make="Seat", model="León")
    listing = Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/1")

    offer = FinanceOffer.objects.create(
        listing=listing,
        deposit=Decimal("2000.00"),
        monthly_payment=Decimal("189.99"),
        number_of_payments=96,
        tin=Decimal("6.950"),
        tae=Decimal("9.320"),
    )
    offer.refresh_from_db()

    assert offer.monthly_payment == Decimal("189.99")
    assert offer.tae == Decimal("9.320")
    assert listing.finance_offers.count() == 1


@pytest.mark.django_db
def test_borrar_el_anuncio_arrastra_sus_ofertas() -> None:
    source = Source.objects.create(name="Portal X", slug="portal-x")
    vehicle = Vehicle.objects.create(make="Seat", model="León")
    listing = Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/1")
    FinanceOffer.objects.create(listing=listing, monthly_payment=Decimal("150.00"))

    listing.delete()

    assert FinanceOffer.objects.count() == 0
