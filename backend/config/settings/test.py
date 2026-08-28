"""Ajustes para la ejecución de tests (pytest)."""

from .base import *

DEBUG = False

# Hashing rápido: los tests no necesitan un algoritmo lento.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# La base de datos se toma de DATABASE_URL (contenedor en local, service en CI).

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
