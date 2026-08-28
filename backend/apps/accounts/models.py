from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Usuario de DRIVEAM.

    De momento hereda de ``AbstractUser`` sin cambios. Se define ya en la FASE 0 para fijar
    ``AUTH_USER_MODEL`` desde el primer commit y evitar una migración costosa más adelante;
    la lógica de autenticación y el perfil de preferencias llegan en la FASE 2.
    """

    class Meta:
        db_table = "accounts_user"
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"
