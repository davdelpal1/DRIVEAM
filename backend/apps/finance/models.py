"""Modelo `FinanceOffer`: condiciones de financiación anunciadas para un anuncio.

En la FASE 1 este modelo **solo almacena** los términos tal y como los publica la fuente
(entrada, cuota, TIN, TAE, cuota final…). Los cálculos deterministas del coste real —y sus
tests obligatorios— son la FASE 6. Todo importe es `Decimal`; mantener separados precio al
contado, importe financiado, cuotas, comisiones y coste total (CLAUDE.md).
"""

from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import TimestampedModel
from apps.listings.models import Listing


class FinanceOffer(TimestampedModel):
    """Oferta de financiación asociada a un anuncio, tal y como se anuncia."""

    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="finance_offers",
        verbose_name="anuncio",
    )
    deposit = models.DecimalField(
        "entrada",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    amount_financed = models.DecimalField(
        "importe financiado",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    monthly_payment = models.DecimalField(
        "cuota mensual",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    number_of_payments = models.PositiveSmallIntegerField("número de cuotas", null=True, blank=True)
    final_payment = models.DecimalField(
        "cuota final",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    opening_fee = models.DecimalField(
        "comisión de apertura",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    tin = models.DecimalField(
        "TIN (%)",
        max_digits=6,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    tae = models.DecimalField(
        "TAE (%)",
        max_digits=6,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    mandatory_products_cost = models.DecimalField(
        "coste de productos obligatorios",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    total_cost = models.DecimalField(
        "coste total anunciado",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    source_text = models.TextField("texto original de la oferta", blank=True)

    class Meta:
        db_table = "finance_finance_offer"
        verbose_name = "oferta de financiación"
        verbose_name_plural = "ofertas de financiación"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        if self.monthly_payment is not None and self.number_of_payments is not None:
            return f"{self.monthly_payment} €/mes en {self.number_of_payments} cuotas"
        return f"Oferta de financiación #{self.pk}"
