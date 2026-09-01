"""Modelo `Score`: resultado del Car Score para un anuncio.

En la FASE 1 solo se define el almacén: `score` (0-100), `version` de la fórmula y un
`breakdown` que debe *explicar* el número (nunca un "92" a secas — CLAUDE.md, PROJECT_VISION §6.6).
El motor de reglas deterministas y la API llegan en la FASE 7.
"""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from apps.listings.models import Listing


class Score(models.Model):
    """Puntuación calculada para un anuncio, opcionalmente personalizada por usuario."""

    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="scores",
        verbose_name="anuncio",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="scores",
        verbose_name="usuario",
        help_text="Vacío = puntuación genérica sin preferencias de usuario.",
    )
    score = models.PositiveSmallIntegerField(
        "puntuación",
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    version = models.CharField("versión de la fórmula", max_length=20)
    breakdown = models.JSONField("desglose explicativo", default=dict)
    calculated_at = models.DateTimeField("calculado el", default=timezone.now)

    class Meta:
        db_table = "scoring_score"
        verbose_name = "puntuación"
        verbose_name_plural = "puntuaciones"
        ordering = ["-calculated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["listing", "user", "version"],
                name="uniq_score_listing_user_version",
                nulls_distinct=False,
            ),
        ]

    def __str__(self) -> str:
        return f"{self.score}/100 ({self.version})"
