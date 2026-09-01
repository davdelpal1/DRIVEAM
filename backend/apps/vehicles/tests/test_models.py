import pytest
from django.core.exceptions import ValidationError

from apps.vehicles.enums import FuelType, Transmission
from apps.vehicles.models import Vehicle


@pytest.mark.django_db
def test_str_combina_marca_modelo_y_version() -> None:
    vehicle = Vehicle.objects.create(make="Seat", model="León", version="1.6 TDI 115 CV")
    assert str(vehicle) == "Seat León 1.6 TDI 115 CV"


@pytest.mark.django_db
def test_str_sin_version() -> None:
    vehicle = Vehicle.objects.create(make="Seat", model="León")
    assert str(vehicle) == "Seat León"


@pytest.mark.django_db
def test_valores_por_defecto_desconocidos_no_cero() -> None:
    vehicle = Vehicle.objects.create(make="Seat", model="León")
    assert vehicle.fuel_type == FuelType.UNKNOWN
    assert vehicle.transmission == Transmission.UNKNOWN
    assert vehicle.first_registration_year is None
    assert vehicle.power_cv is None


@pytest.mark.django_db
def test_anio_de_matriculacion_fuera_de_rango_falla_validacion() -> None:
    vehicle = Vehicle(make="Seat", model="León", first_registration_year=1800)
    with pytest.raises(ValidationError):
        vehicle.full_clean()
