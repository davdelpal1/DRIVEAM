# backend/

API de DRIVEAM: Django 5.2 + Django REST Framework.

## Estructura

```
config/            proyecto Django (settings por entorno, urls, wsgi/asgi, router de la API)
  settings/        base · local · test · production
apps/              una app por dominio
  core/            vista de estado (/api/v1/health/)
  accounts/        modelo User personalizado (AUTH_USER_MODEL); auth real en FASE 2
```

## Comandos (dentro de Docker)

```bash
docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py createsuperuser
docker compose run --rm backend pytest
docker compose run --rm backend ruff check .
docker compose run --rm backend ruff format .
docker compose run --rm backend mypy .
```

## Entornos

`DJANGO_SETTINGS_MODULE` selecciona los ajustes: `config.settings.local` (por defecto),
`config.settings.test` (pytest), `config.settings.production`.

Configuración por variables de entorno: ver `.env.example` en la raíz del repo.
