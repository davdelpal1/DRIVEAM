"""Modelos de fuentes de datos y vendedores.

`Source` es el proveedor del anuncio (portal, concesionario, entrada manual…). `Seller` es
quien vende el coche dentro de esa fuente. Ninguno controla el dominio: son metadatos que
acompañan a `Listing` (ver `ARCHITECTURE.md` §6 y §27).
"""

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import TimestampedModel
from apps.sources.enums import IntegrationType, SellerType


class Source(TimestampedModel):
    """Proveedor de datos: de dónde viene un anuncio."""

    name = models.CharField("nombre", max_length=120)
    slug = models.SlugField("slug", max_length=120, unique=True)
    website = models.URLField("web", max_length=300, blank=True)
    integration_type = models.CharField(
        "tipo de integración",
        max_length=20,
        choices=IntegrationType.choices,
        default=IntegrationType.MANUAL,
    )
    enabled = models.BooleanField("activa", default=True)
    commercial_use_allowed = models.BooleanField("uso comercial permitido", default=False)
    images_allowed = models.BooleanField("imágenes permitidas", default=False)
    refresh_policy = models.CharField("política de refresco", max_length=200, blank=True)
    terms_reviewed_at = models.DateField("términos revisados el", null=True, blank=True)
    notes = models.TextField("notas", blank=True)

    class Meta:
        db_table = "sources_source"
        verbose_name = "fuente"
        verbose_name_plural = "fuentes"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Seller(TimestampedModel):
    """Vendedor de un coche dentro de una fuente concreta."""

    source = models.ForeignKey(
        Source,
        on_delete=models.PROTECT,
        related_name="sellers",
        verbose_name="fuente",
    )
    external_id = models.CharField("id externo", max_length=120, blank=True, default="")
    name = models.CharField("nombre", max_length=200, blank=True)
    type = models.CharField(
        "tipo",
        max_length=20,
        choices=SellerType.choices,
        default=SellerType.UNKNOWN,
    )
    website = models.URLField("web", max_length=300, blank=True)
    phone = models.CharField("teléfono", max_length=40, blank=True)
    location = models.CharField("ubicación", max_length=200, blank=True)
    rating = models.DecimalField(
        "valoración",
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )

    class Meta:
        db_table = "sources_seller"
        verbose_name = "vendedor"
        verbose_name_plural = "vendedores"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["source", "external_id"],
                condition=~models.Q(external_id=""),
                name="uniq_seller_source_external_id",
            ),
        ]

    def __str__(self) -> str:
        return self.name or f"Vendedor #{self.pk}"
