# 0002 — Stack: Django REST Framework + Next.js

- **Estado:** aceptada
- **Fecha:** 2026-08-28

## Contexto

DRIVEAM necesita: un backend con modelo de dominio rico (Vehicle/Listing/Scoring/Finance),
ORM y migraciones sólidas, admin para inspección de datos, y una API REST versionada; y un
frontend web moderno, responsive y con buen SEO en fases posteriores, reutilizable hacia móvil
(React Native). `PROJECT_VISION.md` y `ARCHITECTURE.md` ya fijan esta dirección.

## Decisión

- **Backend:** Django 5.2 LTS + Django REST Framework. `drf-spectacular` para OpenAPI.
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript en modo strict + Tailwind CSS v4.
- Frontend y backend son procesos independientes que se comunican por HTTP/JSON sobre `/api/v1/`.
- Versiones de runtime fijadas en Docker: Python 3.13, Node 22 LTS.

## Alternativas consideradas

- **Backend FastAPI** — excelente para APIs, pero tendríamos que ensamblar ORM, migraciones,
  admin y auth por separado; Django los trae integrados y probados.
- **Frontend SPA (Vite + React Router)** — pierde SSR/SEO que necesitaremos en la FASE 15.
- **Django full-stack (plantillas + HTMX)** — más simple al principio, pero no reutilizable
  hacia apps móviles y aleja el objetivo de producto multiplataforma.

## Consecuencias

- Dos toolchains (Python y Node) y dos imágenes Docker que mantener.
- CORS explícito entre `localhost:3000` y `localhost:8000` en desarrollo.
- El contrato de la API es la frontera: se documenta con OpenAPI y se versiona.
- Django LTS da soporte hasta 2028; la próxima migración mayor está acotada en el tiempo.
