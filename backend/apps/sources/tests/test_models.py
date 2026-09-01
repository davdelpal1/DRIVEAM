import pytest
from django.db import IntegrityError, transaction

from apps.sources.enums import IntegrationType, SellerType
from apps.sources.models import Seller, Source


@pytest.mark.django_db
def test_source_slug_es_unico() -> None:
    Source.objects.create(name="Portal X", slug="portal-x")
    with pytest.raises(IntegrityError), transaction.atomic():
        Source.objects.create(name="Otro portal", slug="portal-x")


@pytest.mark.django_db
def test_source_valores_por_defecto() -> None:
    source = Source.objects.create(name="Portal X", slug="portal-x")
    assert source.integration_type == IntegrationType.MANUAL
    assert source.enabled is True
    assert source.commercial_use_allowed is False
    assert source.images_allowed is False


@pytest.mark.django_db
def test_seller_pertenece_a_su_fuente() -> None:
    source = Source.objects.create(name="Portal X", slug="portal-x")
    seller = Seller.objects.create(source=source, name="Concesionario Sur", type=SellerType.DEALER)
    assert seller in source.sellers.all()
    assert str(seller) == "Concesionario Sur"


@pytest.mark.django_db
def test_seller_external_id_unico_por_fuente() -> None:
    source = Source.objects.create(name="Portal X", slug="portal-x")
    Seller.objects.create(source=source, external_id="v-1", name="A")
    with pytest.raises(IntegrityError), transaction.atomic():
        Seller.objects.create(source=source, external_id="v-1", name="B")
