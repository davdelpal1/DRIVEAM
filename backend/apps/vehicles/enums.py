"""Enumeraciones del dominio de vehículos."""

from django.db import models


class FuelType(models.TextChoices):
    """Tipo de combustible / motorización."""

    PETROL = "gasolina", "Gasolina"
    DIESEL = "diesel", "Diésel"
    HYBRID = "hibrido", "Híbrido"
    PLUGIN_HYBRID = "hibrido_enchufable", "Híbrido enchufable"
    ELECTRIC = "electrico", "Eléctrico"
    LPG = "glp", "GLP (autogás)"
    CNG = "gnc", "GNC (gas natural)"
    OTHER = "otro", "Otro"
    UNKNOWN = "desconocido", "Desconocido"


class Transmission(models.TextChoices):
    """Tipo de cambio."""

    MANUAL = "manual", "Manual"
    AUTOMATIC = "automatica", "Automática"
    UNKNOWN = "desconocida", "Desconocida"
