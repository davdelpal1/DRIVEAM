# Changelog

Todos los cambios relevantes de DRIVEAM se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- **FASE 1 — Modelo de dominio.**
  - Apps de dominio: `sources`, `vehicles`, `listings`, `finance`, `favorites`, `scoring`
    (y `UserPreference` en `accounts`).
  - Modelos: `Source`, `Seller`, `Vehicle`, `Listing`, `ListingSnapshot`, `FinanceOffer`,
    `Favorite`, `UserVehicleNote`, `UserPreference`, `Score`, con base común `TimestampedModel`
    en `apps.core`. `Vehicle` y `Listing` son entidades separadas (1‑N).
  - Enumeraciones: `FuelType`, `Transmission` (`vehicles`), `IntegrationType`, `SellerType`
    (`sources`), `ListingStatus` (`listings`), como `TextChoices` con etiquetas en español.
  - API REST CRUD para `sources`, `sellers`, `vehicles` y `listings`: serializers (con
    representación anidada de vehículo/fuente/vendedor y ofertas de financiación en el anuncio),
    filtros con `django-filter` (rango de precio/kilómetros/año, combustible, estado, búsqueda,
    ordenación), paginación por página y esquema OpenAPI sin avisos. Permisos provisionales
    `IsAuthenticatedOrReadOnly` hasta la FASE 2.
  - Django admin para todos los modelos (con inlines de financiación y capturas en el anuncio,
    y de preferencias en el usuario).
  - Frontend: página `/catalogo` (Server Component con estados de carga, vacío y error) que
    lista cada vehículo con sus anuncios; tipos y cliente en `src/features/catalog/`.
  - 34 tests nuevos de backend (modelos y API) y 3 de frontend.
  - ADR `docs/decisions/0006-modelo-de-dominio.md`.

- **FASE 0 — Fundación del proyecto.**
  - Estructura de monorepo (`frontend/`, `backend/`, `docs/`, `scripts/`).
  - Backend Django 5.2 + Django REST Framework, con settings divididos por entorno
    (`config/settings/{base,local,test,production}.py`) y endpoint `GET /api/v1/health/`.
  - Esquema OpenAPI con `drf-spectacular` en `/api/v1/schema/`.
  - App `accounts` con modelo `User` personalizado (`AUTH_USER_MODEL`), sin lógica de auth todavía.
  - Frontend Next.js 16 (App Router, TypeScript strict) + Tailwind CSS v4, con una home que
    muestra el estado del stack consultando el health endpoint.
  - Tooling: Ruff (lint + formato) y mypy en el backend; ESLint + Prettier + Vitest en el frontend.
  - Orquestación local con Docker Compose (`db`, `backend`, `frontend`).
  - Integración continua con GitHub Actions (lint, typecheck, tests, build, comprobación de migraciones).
  - Renombrado del proyecto de "CarComparator" (provisional) a **DRIVEAM**.
