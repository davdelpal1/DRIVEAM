"""Ajustes para producción.

Todo lo sensible es obligatorio por entorno: si falta una variable, el arranque falla
(mejor un fallo ruidoso que un despliegue inseguro).
"""

from .base import *
from .base import env

DEBUG = False

SECRET_KEY = env("DJANGO_SECRET_KEY")
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")
CORS_ALLOWED_ORIGINS = env.list("DJANGO_CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS")

# Cookies de sesión/CSRF compartidas entre subdominios (p. ej. app. y api. del mismo dominio).
# Si el frontend y la API viven en dominios no relacionados, pon SameSite=None (requiere HTTPS).
SESSION_COOKIE_DOMAIN = env("DJANGO_SESSION_COOKIE_DOMAIN", default=None)
CSRF_COOKIE_DOMAIN = env("DJANGO_CSRF_COOKIE_DOMAIN", default=None)

# HTTPS / cabeceras de seguridad
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = env.int("DJANGO_SECURE_HSTS_SECONDS", default=60 * 60 * 24 * 30)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Logging estructurado mínimo a stdout.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": env("DJANGO_LOG_LEVEL", default="INFO")},
}
