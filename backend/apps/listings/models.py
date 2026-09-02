"""Modelos `Listing` y `ListingSnapshot`.

`Listing` es un anuncio concreto en una fuente concreta (precio, kilómetros, URL, vendedor).
Referencia siempre a un `Vehicle` normalizado. `ListingSnapshot` guarda el estado del anuncio
en un instante para poder reconstruir su histórico; la detección de cambios y el gráfico de
precio llegan en la FASE 9.

Convenciones de datos externos (CLAUDE.md): dinero en `Decimal`; la ausencia de dato es `null`,
nunca `0`; `raw_data` conserva el original sin normalizar pero no sustituye a los campos
estructurados.
"""

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.core.models import TimestampedModel
from apps.listings.enums import ListingStatus, TrackingStatus
from apps.sources.models import Seller, Source
from apps.vehicles.models import Vehicle


class Listing(TimestampedModel):
    """Un anuncio publicado en una fuente."""

    source = models.ForeignKey(
        Source,
        on_delete=models.PROTECT,
        related_name="listings",
        verbose_name="fuente",
    )
    external_id = models.CharField("id externo", max_length=120, blank=True, default="")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_listings",
        verbose_name="propietario",
        help_text="Usuario que dio de alta el anuncio a mano; nulo para anuncios de otras fuentes.",
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.PROTECT,
        related_name="listings",
        verbose_name="vehículo",
    )
    seller = models.ForeignKey(
        Seller,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="listings",
        verbose_name="vendedor",
    )
    url = models.URLField("URL", max_length=500, blank=True, default="")

    title = models.CharField("título", max_length=300, blank=True)
    description = models.TextField("descripción", blank=True)

    price_cash = models.DecimalField(
        "precio al contado",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    price_financed = models.DecimalField(
        "precio financiado anunciado",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )

    mileage_km = models.PositiveIntegerField("kilómetros", null=True, blank=True)
    registration_date = models.DateField("fecha de matriculación", null=True, blank=True)

    province = models.CharField("provincia", max_length=100, blank=True)
    city = models.CharField("localidad", max_length=120, blank=True)

    warranty_months = models.PositiveSmallIntegerField("garantía (meses)", null=True, blank=True)

    status = models.CharField(
        "estado",
        max_length=20,
        choices=ListingStatus.choices,
        default=ListingStatus.ACTIVE,
    )
    archived_at = models.DateTimeField("archivado el", null=True, blank=True)
    tracking_status = models.CharField(
        "estado de seguimiento",
        max_length=20,
        choices=TrackingStatus.choices,
        default=TrackingStatus.NEW,
    )
    first_seen_at = models.DateTimeField("primera vez visto", default=timezone.now)
    last_seen_at = models.DateTimeField("última vez visto", default=timezone.now)
    published_at = models.DateTimeField("publicado el", null=True, blank=True)

    raw_data = models.JSONField("datos originales", default=dict, blank=True)

    class Meta:
        db_table = "listings_listing"
        verbose_name = "anuncio"
        verbose_name_plural = "anuncios"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["source", "external_id"],
                condition=~models.Q(external_id=""),
                name="uniq_listing_source_external_id",
            ),
        ]

    def __str__(self) -> str:
        return self.title or f"{self.vehicle} · {self.source}"


class ListingSnapshot(models.Model):
    """Estado de un anuncio capturado en un instante (para histórico, FASE 9)."""

    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="snapshots",
        verbose_name="anuncio",
    )
    captured_at = models.DateTimeField("capturado el", default=timezone.now)
    price_cash = models.DecimalField(
        "precio al contado", max_digits=10, decimal_places=2, null=True, blank=True
    )
    price_financed = models.DecimalField(
        "precio financiado", max_digits=10, decimal_places=2, null=True, blank=True
    )
    mileage_km = models.PositiveIntegerField("kilómetros", null=True, blank=True)
    status = models.CharField(
        "estado", max_length=20, choices=ListingStatus.choices, default=ListingStatus.UNKNOWN
    )
    raw_data = models.JSONField("datos originales", default=dict, blank=True)

    class Meta:
        db_table = "listings_listing_snapshot"
        verbose_name = "captura de anuncio"
        verbose_name_plural = "capturas de anuncio"
        ordering = ["-captured_at"]

    def __str__(self) -> str:
        return f"{self.listing_id} @ {self.captured_at:%Y-%m-%d %H:%M}"
