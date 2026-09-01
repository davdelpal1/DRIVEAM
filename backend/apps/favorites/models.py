"""Modelos con dueño: `Favorite` y `UserVehicleNote`.

Ambos referencian un `Listing` (un anuncio concreto), no un `Vehicle`: lo que el usuario
guarda y anota es la oferta que está mirando. La API de estos modelos llega en la FASE 3
(añadir/gestionar candidatos); aquí solo se definen el modelo y el admin.
"""

from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel
from apps.listings.models import Listing


class Favorite(models.Model):
    """Marca de un anuncio como favorito por parte de un usuario."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
        verbose_name="usuario",
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="favorited_by",
        verbose_name="anuncio",
    )
    created_at = models.DateTimeField("creado", auto_now_add=True)

    class Meta:
        db_table = "favorites_favorite"
        verbose_name = "favorito"
        verbose_name_plural = "favoritos"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "listing"], name="uniq_favorite_user_listing"),
        ]

    def __str__(self) -> str:
        return f"{self.user} ♥ {self.listing_id}"


class UserVehicleNote(TimestampedModel):
    """Nota personal de un usuario sobre un anuncio."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vehicle_notes",
        verbose_name="usuario",
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="notes",
        verbose_name="anuncio",
    )
    text = models.TextField("texto")

    class Meta:
        db_table = "favorites_user_vehicle_note"
        verbose_name = "nota"
        verbose_name_plural = "notas"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Nota de {self.user} sobre {self.listing_id}"
