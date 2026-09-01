"""Enumeraciones del dominio de fuentes de datos."""

from django.db import models


class IntegrationType(models.TextChoices):
    """Cómo se obtienen los datos de una fuente (ver `PROJECT_VISION.md` §13).

    La implementación concreta de cada tipo (adaptadores, registry) llega en la FASE 8;
    aquí solo se cataloga la fuente.
    """

    MANUAL = "manual", "Entrada manual"
    USER_IMPORT = "user_import", "Importación por URL"
    API = "api", "API"
    FEED = "feed", "Feed"
    AFFILIATE = "affiliate", "Programa de afiliación"
    SCRAPER = "scraper", "Scraper autorizado"


class SellerType(models.TextChoices):
    """Tipo de vendedor de un anuncio."""

    PRIVATE = "particular", "Particular"
    DEALER = "profesional", "Profesional"
    MARKETPLACE = "marketplace", "Marketplace"
    UNKNOWN = "desconocido", "Desconocido"
