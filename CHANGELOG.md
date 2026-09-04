# Changelog

Todos los cambios relevantes de DRIVEAM se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added

- **FASE 8 — Importación por URL.**
  - Patrón Source Adapter en `apps/sources/adapters/`: `base.py` (`SourceAdapter` ABC +
    `RawListing`), `errors.py` (jerarquía `ImportError` con `code` estable y `status_code`),
    `ssrf.py` (`validate_public_url`: solo `http(s)`, sin credenciales, puertos restringidos,
    el host debe resolver solo a IP pública; redirecciones revalidadas; metadatos de la nube
    `169.254.169.254` bloqueados), `fetch.py` (timeout, tamaño máximo, `Content-Type`),
    `normalize.py` (normalizadores puros: precio es-ES, año, combustible, kW→CV, consumo),
    `registry.py` (`AdapterRegistry` + `import_listing()`).
  - Primer adaptador `datos-estructurados` (`structured_data.py`): lee JSON-LD de schema.org
    (`Vehicle`/`Car`/`Product`) y Open Graph de cualquier URL `http(s)`. `parse()` pura, con
    fixtures HTML. No apunta a ningún portal concreto (portales → FASE 13).
  - `POST /api/v1/listings/import/` (`ListingImportView`, autenticado, throttle
    `listings-import`): **no persiste**; devuelve `{source, source_url, title, warnings, raw,
    candidate}`. Errores estructurados `{code, detail}` (400 `unsafe_url`, 422
    `source_not_supported`/`unparseable_listing`, 502 `unfetchable_url`).
  - `CandidateSerializer` gana `import_url` (write-only); si viene,
    `apps/listings/services.create_candidate` usa la fuente `datos-estructurados` y guarda
    `{import_url, imported_at}` en `Listing.raw_data`. Sin modelo ni migración nuevos en
    `listings`.
  - `Vehicle.fuel_consumption` (L/100 km, `Decimal`; migración `vehicles/0002`). El motor
    del Car Score estrena el factor `consumption` (peso `weight_consumption`, curva de
    reserva ≤4/≥9); `Consumo` sale de `DEFERRED_FACTORS`. El comparador estrena la fila
    "Consumo medio".
  - Ajustes: `DJANGO_THROTTLE_LISTINGS_IMPORT` (`30/hour`), `DJANGO_IMPORT_ALLOW_PRIVATE_HOSTS`
    (`False` en producción; relaja la comprobación de IP para dev/E2E).
  - Frontend: feature `src/features/import` (`api.ts`, `import-wizard.tsx`), página
    `/candidatos/importar` (pegar enlace → previsualización con avisos → `CandidateForm`
    precargado → guardar). `CandidateForm` acepta `initialValues`/`importUrl`;
    `fromCandidateInput` en `form-payload.ts`. Enlaces desde el dashboard, el alta manual y
    el estado vacío. Campo "Consumo medio" en el formulario de candidato.
  - Tests: parser (fixtures JSON-LD y Open Graph), normalizadores, SSRF (URLs peligrosas y
    DNS a IP interna), registry y `apps/listings/tests/test_import_api.py`; nuevo caso de
    consumo en `apps/scoring/tests/test_engine.py`; E2E `frontend/e2e/import.spec.ts`.
  - ADR `docs/decisions/0013-importacion-por-url.md` y ficha
    `docs/data-sources/datos-estructurados.md`.

- **Utilidades de demostración (solo desarrollo).**
  - `python manage.py seed_demo`: crea `demo@driveam.test` con preferencias y 5 candidatos
    realistas (Car Score, consumo, financiación, notas; uno importado por URL).
  - `frontend/scripts/demo-navegador.mjs` (`npm run demo`): recorre el MVP completo en un
    navegador real (Chrome/Edge) con narración superpuesta.

- **FASE 7 — Car Score V1.**
  - `apps/scoring/engine.py`: motor puro y determinista `compute_score(inputs, weights) ->
    ScoreBreakdown` (`Decimal`, sin redondeo intermedio, entero final `ROUND_HALF_UP`;
    versión `v1`). Factores: precio, kilómetros, antigüedad, financiación y garantía. Cada
    factor se puntúa contra las preferencias del usuario (`budget_target`/`budget_max`,
    `min_year`, `max_mileage`) con curva de reserva; un factor sin dato no cuenta como `0`
    (se excluye y su peso se redistribuye). `consumo` y `fiabilidad` quedan en `missing`.
  - `apps/scoring/services.py`: puente Django que persiste el `Score` (`update_or_create`
    por `listing`+`user`+`version`). Recálculo disparado al crear/editar el candidato, al
    guardar/borrar la financiación y al cambiar las preferencias; red de seguridad en la
    primera lectura.
  - `UserPreference.weight_warranty` (migración `accounts/0004`, `default=5`), expuesto en
    `/api/v1/preferences/` y en el formulario de preferencias.
  - `CandidateSerializer` rellena `score` y añade `score_breakdown` (el desglose guardado);
    la fila "Car Score" del comparador deja de ser un marcador.
  - Frontend: feature `src/features/scoring` (`score-format.ts` puro y testeado,
    `ScoreBadge`, `ScoreBreakdownPanel`) y página `/candidatos/[id]/score` con la
    explicación por factores. Enlaces desde la tarjeta del dashboard y la ficha.
  - Tests: 7 de `engine` (cifras exactas por factor, normalización de pesos, factor
    ausente, dos perfiles de pesos → rankings distintos) + 4 de API (score persistido al
    crear, recálculo al cambiar preferencias, factor financiación al guardar oferta,
    aislamiento por usuario) + 3 de frontend (`score-format`) + E2E
    `frontend/e2e/score.spec.ts` (los pesos del usuario cambian la puntuación y la banda).
  - ADR `docs/decisions/0012-car-score-v1.md`.

- **FASE 6 — Calculadora de financiación.**
  - `apps/finance/calculator.py`: función pura y determinista `compute_breakdown(...)` con
    `Decimal` (sin redondeo intermedio; cuantización final `ROUND_HALF_UP`). Devuelve
    importe financiado, total en cuotas, coste total financiado, diferencia frente al
    contado y coste anual aproximado. La ausencia de un dato deja la métrica en `None`,
    nunca en `0`. Método V1 = valores anunciados (no se recalcula la cuota desde el TIN).
  - `FinanceOfferSerializer` pasa a escribible y añade el campo calculado `breakdown`.
    Nuevo `POST /api/v1/finance/calculate/` (sin estado) y acción
    `GET·PUT·DELETE /api/v1/candidates/{id}/finance/` (una oferta por candidato). Sin
    modelo nuevo ni migración.
  - `CandidateSerializer` expone `finance_total_cost` y `finance_difference_vs_cash`; el
    comparador (`comparison.ts`) gana la fila "Coste total financiado" (indicador "Menor
    coste total"), cerrando el punto pendiente del ADR 0010.
  - Frontend: feature `src/features/finance` (helpers puros `format.ts`, panel de coste,
    formulario con previsualización en vivo) y página `/candidatos/[id]/financiacion`.
    Enlaces desde el dashboard, la ficha de edición y el comparador.
  - Tests: 8 de `calculator` (cifras exactas, datos ausentes, redondeo) + 5 de API
    (cálculo sin estado, ciclo GET/PUT/DELETE, aislamiento por dueño, coste en el listado)
    + 6 de frontend (`format`) + 1 de `comparison` + E2E `frontend/e2e/finance.spec.ts`
    (previsualización en vivo → guardar → persistencia → fila del comparador).
  - `DEFAULT_THROTTLE_RATES` del registro pasa a ser configurable
    (`DJANGO_THROTTLE_AUTH_REGISTER`, por defecto `5/hour`); `.env.example` lo sube a
    `1000/hour` para desarrollo y para la suite E2E (una cuenta nueva por spec).
  - ADR `docs/decisions/0011-calculadora-financiacion.md`.

- **FASE 5 — Comparador.**
  - Frontend puro: en "Mis coches" cada tarjeta tiene una casilla "Comparar"; al marcar
    entre 2 y 5 candidatos, una barra fija enlaza a `/candidatos/comparar?ids=…`.
  - `/candidatos/comparar`: tabla comparativa (una columna por candidato, primera columna
    fija en horizontal, scroll en móvil) con precio contado/financiado, año, km, potencia,
    garantía, Car Score, combustible, vendedor, ubicación, estado y enlace al anuncio. El
    mejor valor de cada criterio se resalta con su indicador (menor precio, menos km, más
    nuevo, más potencia, más garantía, mejor score). Los empates y los datos ausentes se
    tratan explícitamente; si todos coinciden no se destaca nada.
  - Helpers puros y testeados en `src/features/candidates/comparison.ts`
    (`COMPARISON_ROWS`, `bestIds`, `parseCompareIds`); tabla en `comparison-table.tsx`.
  - `consumo` queda fuera: el modelo `Vehicle` aún no tiene ese dato (llega con la FASE 8).
  - Tests: 8 de `comparison` + 1 de dashboard (selección → enlace de comparar).
  - ADR `docs/decisions/0010-comparador.md`.

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
