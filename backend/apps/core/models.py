"""Modelos base reutilizables por las apps de dominio."""

from django.db import models


class TimestampedModel(models.Model):
    """Añade marcas de tiempo de creación y última modificación.

    Abstracto: no crea tabla propia ni genera migración; cada modelo concreto que herede
    de aquí incorpora las columnas a su propia migración.
    """

    created_at = models.DateTimeField("creado", auto_now_add=True)
    updated_at = models.DateTimeField("actualizado", auto_now=True)

    class Meta:
        abstract = True
