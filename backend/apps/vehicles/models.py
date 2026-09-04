"""Modelo `Vehicle`: el coche normalizado.

Es distinto de `Listing` (un anuncio concreto). Un `Vehicle` puede tener muchos `Listing`.
Esta separación hace posible deduplicar, comparar precios entre fuentes y guardar histórico
(ver `ARCHITECTURE.md` §27.1). La deduplicación real llega en la FASE 12: aquí no se impone
unicidad sobre marca/modelo/versión.
"""

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import TimestampedModel
from apps.vehicles.enums import FuelType, Transmission

# Cota superior fija (no depende de la fecha, para que la migración sea estable en el tiempo).
# Un valor imposible en la práctica; el saneamiento fino del año se hará en la ingesta (FASE 8).
_MAX_REGISTRATION_YEAR = 2100


class Vehicle(TimestampedModel):
    """Coche normalizado: marca, modelo, versión, motorización, año."""

    make = models.CharField("marca", max_length=80)
    model = models.CharField("modelo", max_length=120)
    generation = models.CharField("generación", max_length=120, blank=True)
    version = models.CharField("versión", max_length=200, blank=True)
    body_type = models.CharField("carrocería", max_length=60, blank=True)
    fuel_type = models.CharField(
        "combustible",
        max_length=20,
        choices=FuelType.choices,
        default=FuelType.UNKNOWN,
    )
    transmission = models.CharField(
        "cambio",
        max_length=20,
        choices=Transmission.choices,
        default=Transmission.UNKNOWN,
    )
    engine_displacement = models.PositiveIntegerField("cilindrada (cc)", null=True, blank=True)
    power_kw = models.PositiveIntegerField("potencia (kW)", null=True, blank=True)
    power_cv = models.PositiveIntegerField("potencia (CV)", null=True, blank=True)
    fuel_consumption = models.DecimalField(
        "consumo medio (L/100 km)",
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Consumo medio combinado; llega con la importación por URL (FASE 8).",
    )
    doors = models.PositiveSmallIntegerField("puertas", null=True, blank=True)
    seats = models.PositiveSmallIntegerField("plazas", null=True, blank=True)
    first_registration_year = models.PositiveSmallIntegerField(
        "año de matriculación",
        null=True,
        blank=True,
        validators=[
            MinValueValidator(1900),
            MaxValueValidator(_MAX_REGISTRATION_YEAR),
        ],
    )
    emissions_label = models.CharField("etiqueta ambiental", max_length=10, blank=True)

    class Meta:
        db_table = "vehicles_vehicle"
        verbose_name = "vehículo"
        verbose_name_plural = "vehículos"
        ordering = ["make", "model"]

    def __str__(self) -> str:
        parts = [self.make, self.model, self.version]
        return " ".join(part for part in parts if part).strip()
