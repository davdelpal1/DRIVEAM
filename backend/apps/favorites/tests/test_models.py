import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction

from apps.favorites.models import Favorite, UserVehicleNote
from apps.listings.models import Listing
from apps.sources.models import Source
from apps.vehicles.models import Vehicle

User = get_user_model()


@pytest.fixture
def listing(db: None) -> Listing:
    source = Source.objects.create(name="Portal X", slug="portal-x")
    vehicle = Vehicle.objects.create(make="Seat", model="León")
    return Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/1")


@pytest.mark.django_db
def test_un_usuario_no_puede_marcar_dos_veces_el_mismo_anuncio(listing: Listing) -> None:
    user = User.objects.create_user(email="ana@example.test", password="secreta-123")
    Favorite.objects.create(user=user, listing=listing)
    with pytest.raises(IntegrityError), transaction.atomic():
        Favorite.objects.create(user=user, listing=listing)


@pytest.mark.django_db
def test_dos_usuarios_pueden_marcar_el_mismo_anuncio(listing: Listing) -> None:
    ana = User.objects.create_user(email="ana@example.test", password="secreta-123")
    luis = User.objects.create_user(email="luis@example.test", password="secreta-123")
    Favorite.objects.create(user=ana, listing=listing)
    Favorite.objects.create(user=luis, listing=listing)
    assert listing.favorited_by.count() == 2


@pytest.mark.django_db
def test_nota_pertenece_al_anuncio(listing: Listing) -> None:
    user = User.objects.create_user(email="ana@example.test", password="secreta-123")
    nota = UserVehicleNote.objects.create(
        user=user, listing=listing, text="Preguntar por la distribución"
    )
    assert nota in listing.notes.all()
