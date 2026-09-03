from typing import Any, ClassVar

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as DjangoUserManager
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import TimestampedModel


class UserManager(DjangoUserManager["User"]):
    """Gestor de usuarios que identifica por email en lugar de por ``username``."""

    def _create_user(self, email: str, password: str | None, **extra_fields: Any) -> "User":
        if not email:
            raise ValueError("El email es obligatorio.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(  # type: ignore[override]
        self, email: str, password: str | None = None, **extra_fields: Any
    ) -> "User":
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(  # type: ignore[override]
        self, email: str, password: str | None = None, **extra_fields: Any
    ) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Un superusuario debe tener is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Un superusuario debe tener is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Usuario de DRIVEAM.

    La autenticación es por **email + contraseña** (sin ``username``); ``USERNAME_FIELD`` se fija
    en la FASE 2 y el modelo ya existía desde la FASE 0 para no arrastrar una migración costosa de
    ``AUTH_USER_MODEL``. Sin OAuth hasta que una fase lo necesite.
    """

    username = None  # type: ignore[assignment]
    email = models.EmailField("correo electrónico", unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    objects: ClassVar[UserManager] = UserManager()

    class Meta:
        db_table = "accounts_user"
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"

    def __str__(self) -> str:
        return self.email


class UserPreference(TimestampedModel):
    """Criterios de compra y pesos del Car Score de un usuario.

    Se define el modelo en la FASE 1 (forma parte del modelo de dominio). La API para leer y
    editar preferencias llega en la FASE 2 (`GET·PUT·PATCH /api/v1/preferences/`); su uso real en
    el scoring es la FASE 7. Los pesos por defecto salen de la tabla de `PROJECT_VISION.md` §7; en
    la FASE 7 el motor los normaliza.
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
    weight_warranty = models.PositiveSmallIntegerField("peso · garantía", default=5)

    class Meta:
        db_table = "accounts_user_preference"
        verbose_name = "preferencia de usuario"
        verbose_name_plural = "preferencias de usuario"

    def __str__(self) -> str:
        return f"Preferencias de {self.user}"
