# Changelog

Todos los cambios relevantes de DRIVEAM se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- **FASE 4 — Dashboard "Mis coches".**
  - `Listing.tracking_status` + enum `TrackingStatus` (`nuevo` / `interesado` / `contactado` /
    `visita` / `descartado` / `comprado`): estado de seguimiento personal del candidato,
    distinto de `ListingStatus` y de `archived_at`. Migración `listings/0003`.
  - `CandidateSerializer` gana `tracking_status` (escribible; se cambia por el `PATCH
    /api/v1/candidates/{id}/` existente), `source` / `source_label` y `score` (placeholder
    `null` hasta la FASE 7). `CandidateFilter` ampliado: `price_min/max`, `year_min/max`,
    `mileage_max`, `fuel_type`, `tracking_status`, `is_favorite`.
  - Frontend: `/candidatos` pasa a ser el dashboard "Mis coches" — barra de filtros (precio,
    año, km, combustible, estado, solo favoritos, archivados), ordenación (precio, score, km,
    año, fecha de alta) y tarjetas con placeholder de imagen, fuente, score y `<select>` de
    estado por tarjeta. Filtrado y orden en cliente (`dashboard-filters.ts`, puro y testeado).
    Enlace de cabecera "Candidatos" → "Mis coches".
  - Tests: 5 de backend (estado por defecto, cambio de estado, filtros por estado/precio/año/
    favorito) y 7 de frontend (helpers + dashboard); E2E ampliado con cambio de estado y filtro.
  - ADR `docs/decisions/0009-dashboard-mis-coches.md`.

- **FASE 3 — Alta manual de candidatos.**
  - `Listing.owner` (nulable), `Listing.archived_at`, `Listing.url` opcional; migración
    `listings/0002`. Endpoint plano `GET·POST·PATCH·DELETE /api/v1/candidates/`
    (`CandidateViewSet`) filtrado por `owner`, con acciones `archive` / `unarchive` /
    `favorite` / `unfavorite` y capa de servicio `apps/listings/services.py` (crea
    `Vehicle` + `Listing` + `Seller` + `UserVehicleNote` en una transacción; fuente sintética
    `manual`).
  - Frontend: `/candidatos`, `/candidatos/nuevo`, `/candidatos/[id]/editar`; feature
    `src/features/candidates`; guard en `src/proxy.ts`.
  - ADR `docs/decisions/0008-candidatos-manuales.md`, `docs/data-sources/manual.md`.

- **FASE 2 — Autenticación y perfil.**
  - Autenticación por sesión de Django (email + contraseña, sin `username`): endpoints
    `auth/csrf/`, `auth/register/`, `auth/login/`, `auth/logout/`, `auth/me/` en `apps/accounts`,
    hechos a mano. Registro con flag `DJANGO_REGISTRATION_ENABLED`; `login`/`register` con rate
    limiting (`ScopedRateThrottle`). Endurecimiento de cookies de sesión/CSRF y
    `CSRF_TRUSTED_ORIGINS` / `CORS_ALLOW_CREDENTIALS`.
  - `GET·PUT·PATCH /api/v1/preferences/` — preferencias de compra del usuario (singleton
    autocreado): presupuestos, año/kilómetros, combustibles, carrocerías y pesos `weight_*` del
    Car Score (0–100).
  - Revisión de permisos del catálogo (cierra deuda del ADR 0006): `Source` escribible solo por
    `is_staff` (`IsAdminUserOrReadOnly` en `apps/core`); resto sin cambios.
  - Frontend: páginas `/entrar`, `/registro` y `/perfil` (guard server-side + `proxy.ts`
    optimista), `AuthProvider` + `SiteHeader`, cliente HTTP con cookie de sesión y `X-CSRFToken`
    (`apiMutate`), reenvío de cookies en Server Components (`src/lib/server-api.ts`). Componente
    `ui/input`. Features `auth/` y `preferences/`.
  - Tests: 24 nuevos de backend (auth, preferencias, permisos, modelo `User`, manejador de
    excepciones) y 7 de frontend; E2E con Playwright (Chromium) del flujo registro →
    preferencias → logout, con job `e2e` en CI.
  - ADR `docs/decisions/0007-autenticacion-y-sesion.md`.

### Fixed

- Mensaje de rate limiting (HTTP 429) en español natural ("Demasiados intentos. Vuelve a
  intentarlo en N segundos.") mediante un `EXCEPTION_HANDLER` propio en `apps/core`, en lugar de
  la traducción literal de DRF.
- Formato Prettier de tres ficheros del frontend de la FASE 1 (`catalogo/page.tsx`,
  `catalog/vehicle-list.tsx(.test)`).

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
