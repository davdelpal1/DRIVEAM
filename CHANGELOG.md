# Changelog

Todos los cambios relevantes de DRIVEAM se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- **FASE 0 — Fundación del proyecto.**
  - Estructura de monorepo (`frontend/`, `backend/`, `docs/`, `scripts/`).
  - Backend Django 5.2 + Django REST Framework, con settings divididos por entorno
    (`config/settings/{base,local,test,production}.py`) y endpoint `GET /api/v1/health/`.
  - Esquema OpenAPI con `drf-spectacular` en `/api/v1/schema/`.
  - App `accounts` con modelo `User` personalizado (`AUTH_USER_MODEL`), sin lógica de auth todavía.
  - Frontend Next.js 15 (App Router, TypeScript strict) + Tailwind CSS v4, con una home que
    muestra el estado del stack consultando el health endpoint.
  - Tooling: Ruff (lint + formato) y mypy en el backend; ESLint + Prettier + Vitest en el frontend.
  - Orquestación local con Docker Compose (`db`, `backend`, `frontend`).
  - Integración continua con GitHub Actions (lint, typecheck, tests, build, comprobación de migraciones).
  - Renombrado del proyecto de "CarComparator" (provisional) a **DRIVEAM**.
