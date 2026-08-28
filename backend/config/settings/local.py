"""Ajustes para desarrollo local."""

from .base import *
from .base import env

DEBUG = True

ALLOWED_HOSTS = env.list(
    "DJANGO_ALLOWED_HOSTS",
    default=["localhost", "127.0.0.1", "0.0.0.0", "backend"],
)

# En local permitimos siempre el frontend de desarrollo.
CORS_ALLOWED_ORIGINS = env.list(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    default=["http://localhost:3000", "http://127.0.0.1:3000"],
)

# Consola como backend de correo mientras no haya envío real.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
