"""Enumeraciones del dominio de anuncios."""

from django.db import models


class ListingStatus(models.TextChoices):
    """Estado del anuncio en su fuente.

    Es el estado del *anuncio*, no el del candidato para el usuario (los estados de
    seguimiento personal — NEW, INTERESTED, VISIT… — llegan en la FASE 4).
    """

    ACTIVE = "activo", "Activo"
    RESERVED = "reservado", "Reservado"
    SOLD = "vendido", "Vendido"
    REMOVED = "retirado", "Retirado"
    UNKNOWN = "desconocido", "Desconocido"
