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


class TrackingStatus(models.TextChoices):
    """Estado de seguimiento del candidato *para el usuario* (FASE 4).

    Es distinto de `ListingStatus` (estado del anuncio en su fuente) y de `archived_at`
    (el usuario aparta el candidato sin descartarlo). Refleja en qué punto del proceso de
    compra está el usuario con ese coche.
    """

    NEW = "nuevo", "Nuevo"
    INTERESTED = "interesado", "Interesado"
    CONTACTED = "contactado", "Contactado"
    VISIT = "visita", "Visita"
    DISCARDED = "descartado", "Descartado"
    PURCHASED = "comprado", "Comprado"
