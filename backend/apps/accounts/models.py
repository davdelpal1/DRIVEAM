from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import TimestampedModel


class User(AbstractUser):
    """Usuario de DRIVEAM.

    De momento hereda de ``AbstractUser`` sin cambios. Se define ya en la FASE 0 para fijar
    ``AUTH_USER_MODEL`` desde el primer commit y evitar una migración costosa más adelante;
    la lógica de autenticación llega en la FASE 2.
    """

    class Meta:
        db_table = "accounts_user"
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"


class UserPreference(TimestampedModel):
    """Criterios de compra y pesos del Car Score de un usuario.

    Se define el modelo en la FASE 1 (forma parte del modelo de dominio). La API para leer y
    editar preferencias, y su uso real en el scoring, llegan en las FASES 2 y 7. Los pesos por
    defecto salen de la tabla de `PROJECT_VISION.md` §7; en la FASE 7 el motor los normaliza.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="preference",
        verbose_name="usuario",
    )

    budget_target = models.DecimalField(
        "presupuesto objetivo",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    budget_max = models.DecimalField(
        "presupuesto máximo",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    max_mileage = models.PositiveIntegerField("kilometraje máximo", null=True, blank=True)
    min_year = models.PositiveSmallIntegerField("año mínimo", null=True, blank=True)

    fuel_types = models.JSONField("combustibles aceptados", default=list, blank=True)
    body_types = models.JSONField("carrocerías aceptadas", default=list, blank=True)

    weight_price = models.PositiveSmallIntegerField("peso · precio", default=25)
    weight_mileage = models.PositiveSmallIntegerField("peso · kilómetros", default=20)
    weight_age = models.PositiveSmallIntegerField("peso · antigüedad", default=15)
    weight_reliability = models.PositiveSmallIntegerField("peso · fiabilidad", default=15)
    weight_consumption = models.PositiveSmallIntegerField("peso · consumo", default=10)
    weight_financing = models.PositiveSmallIntegerField("peso · financiación", default=10)

    class Meta:
        db_table = "accounts_user_preference"
        verbose_name = "preferencia de usuario"
        verbose_name_plural = "preferencias de usuario"

    def __str__(self) -> str:
        return f"Preferencias de {self.user}"
