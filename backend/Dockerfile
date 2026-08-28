# syntax=docker/dockerfile:1

# ============================================================
# Base común
# ============================================================
FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN groupadd --system app \
    && useradd --system --gid app --home-dir /app --shell /usr/sbin/nologin app

# ============================================================
# development — recarga automática, dependencias de test incluidas.
# El código se monta por bind mount desde docker-compose.
# ============================================================
FROM base AS development

# El módulo de settings lo resuelven manage.py/wsgi (local por defecto) y pytest (test).

COPY pyproject.toml ./
COPY config ./config
COPY apps ./apps
COPY manage.py conftest.py ./

RUN pip install --upgrade pip && pip install -e ".[dev]"

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ============================================================
# production — solo runtime, gunicorn, usuario sin privilegios.
# ============================================================
FROM base AS production

ENV DJANGO_SETTINGS_MODULE=config.settings.production

COPY pyproject.toml ./
COPY config ./config
COPY apps ./apps
COPY manage.py ./

RUN pip install --upgrade pip && pip install . \
    && chown -R app:app /app

USER app

RUN DJANGO_SECRET_KEY=build-time DJANGO_ALLOWED_HOSTS=localhost \
    DJANGO_CORS_ALLOWED_ORIGINS=https://localhost \
    python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
