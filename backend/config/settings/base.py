"""Ajustes comunes a todos los entornos.

Los valores sensibles o dependientes del entorno se leen de variables de entorno
(ver `.env.example`). Nunca poner secretos reales aquí.
"""

from pathlib import Path

import environ

# backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()

# En desarrollo sin Docker se lee el .env de la raíz del repo.
# En Docker las variables ya vienen inyectadas por `env_file`.
_ENV_FILE = BASE_DIR.parent / ".env"
if _ENV_FILE.exists():
    env.read_env(str(_ENV_FILE))

# ------------------------------------------------------------------
# Núcleo
# ------------------------------------------------------------------
SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-dev-key-not-for-production")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Terceros
    "rest_framework",
    "django_filters",
    "drf_spectacular",
    "corsheaders",
    # DRIVEAM
    "apps.accounts",
    "apps.core",
    "apps.sources",
    "apps.vehicles",
    "apps.listings",
    "apps.finance",
    "apps.favorites",
    "apps.scoring",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ------------------------------------------------------------------
# Base de datos
# ------------------------------------------------------------------
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgres://driveam:driveam@db:5432/driveam",
    ),
}
DATABASES["default"]["ATOMIC_REQUESTS"] = True

# ------------------------------------------------------------------
# Autenticación
# ------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# El registro de nuevas cuentas por API se puede cerrar sin desplegar código.
REGISTRATION_ENABLED = env.bool("DJANGO_REGISTRATION_ENABLED", default=True)

# ------------------------------------------------------------------
# Sesión y CSRF (auth por cookie de sesión, ver ADR 0007)
# ------------------------------------------------------------------
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = env("DJANGO_SESSION_COOKIE_SAMESITE", default="Lax")
CSRF_COOKIE_SAMESITE = env("DJANGO_CSRF_COOKIE_SAMESITE", default="Lax")
# Orígenes del frontend autorizados a enviar peticiones de escritura (comprobación de `Origin`).
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])

# ------------------------------------------------------------------
# Internacionalización
# ------------------------------------------------------------------
LANGUAGE_CODE = "es-es"
TIME_ZONE = "Europe/Madrid"
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------------
# Archivos estáticos
# ------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------------------------------------------------
# Django REST Framework
# ------------------------------------------------------------------
REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "apps.core.exceptions.exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    # Límite en endpoints sensibles (login/registro). Usa el backend de caché por defecto
    # (`LocMemCache`, por proceso); en producción con varios procesos hará falta caché compartida.
    "DEFAULT_THROTTLE_RATES": {
        "auth-login": env("DJANGO_THROTTLE_AUTH_LOGIN", default="10/min"),
        # 5/hour es lo adecuado en producción; el desarrollo y la suite E2E (una cuenta nueva
        # por spec) lo suben vía `.env` (ver `.env.example`).
        "auth-register": env("DJANGO_THROTTLE_AUTH_REGISTER", default="5/hour"),
        # Importación por URL (FASE 8): descarga páginas externas, conviene un límite holgado.
        "listings-import": env("DJANGO_THROTTLE_LISTINGS_IMPORT", default="30/hour"),
    },
}

# ------------------------------------------------------------------
# Importación por URL (FASE 8) — prevención de SSRF
# ------------------------------------------------------------------
# En True se omite la comprobación de rango de IP del host (solo desarrollo / E2E, que
# apuntan a un servidor de fixtures local). En producción SIEMPRE False.
IMPORT_ALLOW_PRIVATE_HOSTS = env.bool("DJANGO_IMPORT_ALLOW_PRIVATE_HOSTS", default=False)

SPECTACULAR_SETTINGS = {
    "TITLE": "DRIVEAM API",
    "DESCRIPTION": (
        "API de DRIVEAM — búsqueda, normalización y comparación de vehículos de ocasión."
    ),
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api/v[0-9]+",
}

# ------------------------------------------------------------------
# CORS (orígenes permitidos para llamar a la API desde el navegador)
# ------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env.list("DJANGO_CORS_ALLOWED_ORIGINS", default=[])
# El frontend envía la cookie de sesión: se necesita allowlist explícita (nunca `*`) y credenciales.
CORS_ALLOW_CREDENTIALS = True
