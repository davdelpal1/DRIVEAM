import pytest
from django.core.exceptions import ValidationError

from apps.listings.models import Listing
from apps.scoring.models import Score
from apps.sources.models import Source
from apps.vehicles.models import Vehicle


@pytest.fixture
def listing(db: None) -> Listing:
    source = Source.objects.create(name="Portal X", slug="portal-x")
    vehicle = Vehicle.objects.create(make="Seat", model="León")
    return Listing.objects.create(source=source, vehicle=vehicle, url="https://ejemplo.test/1")


@pytest.mark.django_db
def test_score_fuera_del_rango_0_100_falla_validacion(listing: Listing) -> None:
    score = Score(listing=listing, score=120, version="v1")
    with pytest.raises(ValidationError):
        score.full_clean()


@pytest.mark.django_db
def test_score_guarda_un_desglose_explicativo(listing: Listing) -> None:
    score = Score.objects.create(
        listing=listing,
        score=87,
        version="v1",
        breakdown={"precio": 92, "kilometros": 87, "antiguedad": 83},
    )
    score.refresh_from_db()
    assert score.breakdown["precio"] == 92
    assert str(score) == "87/100 (v1)"
