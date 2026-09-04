# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Idioma: la documentación, el producto y las respuestas de trabajo en este repositorio son en **español (España)**.

## Estado del proyecto

**Rediseño de interfaz completado** (post-FASE 8, antes de evaluar el MVP). Sistema de
diseño con tokens de color en `frontend/src/app/globals.css` (paleta "automoción, moderno y
confiable": azul + verde eléctrico, claro/oscuro con toggle manual) y componentes nuevos en
`frontend/src/components/ui/` (`Card`, `Badge`, `Select`, `Textarea`, `Field`/`Fieldset`,
`Alert`, `Stat`, `EmptyState`, `PageHeader`) más `Container`, `SiteHeader`/`SiteFooter` y
`ThemeToggle`. Reskin de todas las pantallas sin tocar lógica de negocio, helpers puros ni
contratos de API; la home pasa a ser una landing real y el panel de diagnóstico de servicios
se movió a `/estado`. Ver `docs/decisions/0014-rediseno-ui.md`.

**FASE 8 completada.** Importación por URL. Patrón Source Adapter real en
`backend/apps/sources/adapters/`: `base.py` (`SourceAdapter` ABC + `RawListing`), `errors.py`
(jerarquía `ImportError` con `code` estable + `status_code`), `ssrf.py`
(`validate_public_url`: esquema/puertos/credenciales + DNS **solo a IP pública**, redirecciones
revalidadas; `settings.IMPORT_ALLOW_PRIVATE_HOSTS` lo relaja solo en dev/E2E), `fetch.py`
(timeout, tamaño máx., `Content-Type`), `normalize.py` (normalizadores **puros**), `registry.py`
(`AdapterRegistry` + `import_listing()` = validar→descargar→parsear) y `structured_data.py`
(primer adaptador: JSON-LD schema.org `Vehicle`/`Car`/`Product` + Open Graph de cualquier URL
`http(s)`; `parse()` pura, fixtures en `tests/fixtures/`). No apunta a ningún portal concreto
(decisión legal conservadora; portales → FASE 13). Endpoint `POST /api/v1/listings/import/`
(`ListingImportView`, autenticado, throttle `listings-import`) **no persiste**: devuelve
`{source, source_url, title, warnings, raw, candidate}`; errores `{code, detail}` con
400/422/502. Guardar reutiliza `POST /api/v1/candidates/`: `CandidateSerializer` gana
`import_url` (write-only) y `apps/listings/services.create_candidate` usa entonces la fuente
`datos-estructurados` + guarda `{import_url, imported_at}` en `Listing.raw_data`. Nuevo
`Vehicle.fuel_consumption` (L/100 km, migración `vehicles/0002`): el motor del Car Score estrena
el factor `consumption` (peso `weight_consumption`, curva de reserva ≤4/≥9; sale de
`DEFERRED_FACTORS`, solo queda `Fiabilidad`) y el comparador la fila "Consumo medio". Frontend:
feature `src/features/import` (`api.ts`, `import-wizard.tsx`), página `/candidatos/importar`,
`CandidateForm` acepta `initialValues`+`importUrl`, `fromCandidateInput` en `form-payload.ts`,
enlaces desde dashboard/alta manual/estado vacío. Tests en `apps/sources/adapters/tests/` +
`apps/listings/tests/test_import_api.py` + E2E `frontend/e2e/import.spec.ts`. Ver
`docs/decisions/0013` y `docs/data-sources/datos-estructurados.md`.

**FASE 7 completada.** Car Score V1. Motor puro y determinista en
`backend/apps/scoring/engine.py` (`compute_score(inputs, weights) → ScoreBreakdown`, todo
`Decimal`, sin redondeo intermedio, entero final `ROUND_HALF_UP`; versión `SCORE_VERSION =
"v1"`). Factores: **precio, kilómetros, antigüedad, financiación, garantía** — cada uno
puntuado 0-100 contra las preferencias del usuario (`budget_target`/`budget_max`, `min_year`,
`max_mileage`) con curva de reserva si la preferencia no está; un factor sin dato se **excluye
del reparto** (su peso se redistribuye), nunca cuenta `0`; un precio sin ninguna referencia de
presupuesto no se puntúa. `consumo` (sin dato hasta FASE 8) y `fiabilidad` (sin fuente fiable)
quedan en `missing`. `apps/scoring/services.py` es el puente Django: **persiste** en el modelo
`Score` (`update_or_create` por `listing`+`user`+`version`) y recalcula al crear/editar el
candidato, al guardar/borrar la financiación y al cambiar las preferencias (red de seguridad en
la primera lectura sin fila). Nuevo `UserPreference.weight_warranty` (migración `accounts/0004`,
`default=5`). `CandidateSerializer` rellena `score` y añade `score_breakdown`; el comparador
estrena la fila "Car Score" real. Frontend: feature `src/features/scoring` (`score-format.ts`
puro y testeado, `ScoreBadge`, `ScoreBreakdownPanel`) y página `/candidatos/[id]/score`; badge
y enlace desde la tarjeta del dashboard y la ficha.
Tests obligatorios en `apps/scoring/tests/`. Ver `docs/decisions/0012`.

**FASE 6 completada.** Calculadora de financiación. Backend: cálculo puro y determinista en
`backend/apps/finance/calculator.py` (`compute_breakdown` → `FinanceBreakdown`, todo
`Decimal`, sin redondeo intermedio, `ROUND_HALF_UP` final; la ausencia de un dato deja la
métrica en `None`, nunca `0`; entrada/apertura/productos ausentes se asumen `0`; método V1
"valores anunciados": no se recalcula la cuota desde el TIN). `FinanceOfferSerializer` pasa a
escribible y añade el campo calculado `breakdown`. Endpoints: `POST /api/v1/finance/calculate/`
(sin estado, previsualización) y acción `GET·PUT·DELETE /api/v1/candidates/{id}/finance/` (una
oferta por candidato, `update_or_create`). **Sin modelo nuevo ni migración.**
`CandidateSerializer` expone `finance_total_cost` y `finance_difference_vs_cash`; el comparador
gana la fila "Coste total financiado". Frontend: feature `src/features/finance` (`format.ts`
puro y testeado, `finance-breakdown.tsx`, `finance-form.tsx` con debounce) y página
`/candidatos/[id]/financiacion`; enlaces desde el dashboard, la ficha y el comparador. Tests
obligatorios en `apps/finance/tests/` + E2E `frontend/e2e/finance.spec.ts`. El límite del
endpoint de registro es configurable (`DJANGO_THROTTLE_AUTH_REGISTER`, `5/hour` por defecto;
`.env.example` lo sube para dev/E2E). Ver `docs/decisions/0011`.

**FASE 5 completada.** Comparador (solo frontend, sin backend nuevo): `/candidatos/comparar`
reutiliza `GET /api/v1/candidates/` y filtra por `?ids=1,2,3` (2–5). Selección desde el
dashboard con una casilla "Comparar" por tarjeta + barra fija; tabla comparativa con primera
columna `sticky` y scroll horizontal en móvil, resaltando el mejor valor de cada criterio
(precio contado/financiado, año, km, potencia, garantía, score). Helpers puros y testeados en
`src/features/candidates/comparison.ts` (`COMPARISON_ROWS`, `bestIds`, `parseCompareIds`),
tabla en `comparison-table.tsx`. `consumo` aplazado (no hay dato hasta FASE 8). Ver
`docs/decisions/0010`.

**FASE 4 completada.** Sobre la FASE 3 (alta manual de candidatos), la FASE 2 (autenticación
por sesión de Django + `/api/v1/preferences/`), la FASE 1 (modelo de dominio + API del catálogo
+ `/catalogo`) y la FASE 0 (monorepo, Docker Compose `db`+`backend`+`frontend`, CI):
dashboard "Mis coches". Backend: `Listing.tracking_status` + enum `TrackingStatus`
(`nuevo`/`interesado`/`contactado`/`visita`/`descartado`/`comprado`; migración `listings/0003`),
`CandidateSerializer` expone `tracking_status` (escribible vía `PATCH /api/v1/candidates/{id}/`),
`source`/`source_label` y `score` (`null` hasta FASE 7); `CandidateFilter` con
precio/año/km/combustible/estado/favorito. Frontend: `/candidatos` es el dashboard
(`src/features/candidates/candidate-dashboard.tsx` + helpers puros `dashboard-filters.ts`),
filtrado y orden en **cliente**, tarjetas con placeholder de imagen + `<select>` de estado por
tarjeta; enlace de cabecera "Mis coches". Ver `docs/decisions/0009`.

FASE 3: `Listing.owner` (nulable) + `Listing.archived_at` + `Listing.url` opcional; endpoint
plano `GET·POST·PATCH·DELETE /api/v1/candidates/` en `apps/listings` (filtrado por `owner`) con
acciones `archive`/`unarchive`/`favorite`/`unfavorite` y capa de servicio
`apps/listings/services.py` (crea `Vehicle`+`Listing`+`Seller`+`UserVehicleNote` en una
transacción; fuente sintética `manual`). Frontend: `/candidatos/nuevo`,
`/candidatos/[id]/editar`, feature `src/features/candidates`, guard en `src/proxy.ts`. Ver
`docs/decisions/0008` y `docs/data-sources/manual.md`. Auth: endpoints
`auth/{csrf,register,login,logout,me}` en `apps/accounts`, rate limiting y flag
`DJANGO_REGISTRATION_ENABLED`; `AuthProvider` + `apiMutate` con `X-CSRFToken`. E2E con
Playwright (job `e2e` en CI). Arranque: `cp .env.example .env` && `docker compose up --build`.
Remoto: `github.com/davdelpal1/DRIVEAM`.

**Siguiente:** el MVP personal (FASES 0–8) está completo. Según la disciplina de hoja de ruta
(PLAN.md), **parar y evaluar el producto con una búsqueda real de coche** antes de seguir. La
FASE 9 (Historial: `ListingSnapshot`, gráfico de precio) es la siguiente si se continúa.

Los cuatro documentos que son fuente de verdad, en orden de lectura:

- [README.md](README.md) — problema, propuesta de valor, alcance del MVP, stack
- [PROJECT_VISION.md](PROJECT_VISION.md) — visión de producto, Jobs To Be Done, diseño del Car Score, estrategia de datos
- [ARCHITECTURE.md](ARCHITECTURE.md) — arquitectura lógica, modelo de datos, patrón de adaptadores, principios innegociables (§27)
- [PLAN.md](PLAN.md) — hoja de ruta por fases; cada fase debe terminar con software utilizable

La moneda es EUR; la financiación usa términos españoles (TIN, TAE, cuota, entrada, cuota final). Mantén la documentación nueva y los textos de interfaz en español salvo que se pida lo contrario.

## Arquitectura prevista

Monorepo. Cliente web Next.js (TypeScript strict, Tailwind) → API Django REST Framework → PostgreSQL. Celery + Redis están **aplazados** y no deben aparecer hasta que una fase los necesite de verdad (ver PLAN.md FASE 10).

```
frontend/            Next.js 16 (App Router) — organizar por feature, no un components/ plano
  src/app/           rutas · src/components/ui/ sistema de componentes · src/lib/ (api.ts, cn.ts)
  src/features/      una carpeta por feature (p. ej. catalog/: types.ts, api.ts, componentes)
backend/
  config/            proyecto Django: settings/{base,local,test,production}, urls, api_router
  apps/              una app por dominio: accounts (User + UserPreference), core (health +
                     TimestampedModel), sources, vehicles, listings, finance, favorites,
                     scoring. El comparador (FASE 5) es solo frontend: no hay app
                     `comparisons` porque todavía no se persiste ninguna comparación.
                     api.py = serializers + viewsets
                     + filtersets; enums.py = TextChoices del dominio
docs/decisions/      ADRs 0001-0006 (Contexto / Decisión / Alternativas / Consecuencias)
docs/data-sources/   un fichero por fuente externa (plantilla en _template.md)
```

> Next.js 16 tiene cambios importantes respecto a versiones anteriores. Antes de tocar el
> frontend, consulta `frontend/node_modules/next/dist/docs/` (ver `frontend/AGENTS.md`).

Capas del backend: `View → Service/Use Case → Domain/Model → Repository/ORM`. Introduce una capa solo cuando la operación no sea trivial — no añadas ceremonia alrededor de un CRUD simple.

### La distinción de dominio de la que depende todo

`Vehicle` (coche normalizado: marca/modelo/versión/año/motor) y `Listing` (un anuncio concreto en una fuente concreta, con precio/kilómetros/URL/vendedor) son **entidades separadas**. Un `Vehicle` puede tener muchos `Listing`. Esta separación es lo que hace posible la deduplicación, la comparación de precios entre fuentes, el histórico de precios y las integraciones sustituibles. Nunca las fusiones.

### Patrón Source Adapter

Cada fuente de datos (entrada manual, importación por URL, API, feed, scraper) implementa una única interfaz — aproximadamente `can_handle(url)`, `fetch_listing(url)`, `normalize(raw_data)` — y se registra en un registry. **El resto de la aplicación no debe saber cómo se obtuvo un anuncio.** El frontend nunca habla con un scraper. Un scraper es un detalle de implementación, no parte del dominio.

Pipeline de ingesta: `SourceAdapter → Raw Listing → Validator → Normalizer → Deduplicator → Vehicle + Listing → Snapshot → Scoring`. Cada paso observable y testeable.

Conserva el valor original y el normalizado siempre que sea razonable (p. ej. `{"raw": "87.320 kms", "normalized": 87320}`); `Listing.raw_data` guarda datos sin normalizar de la fuente pero nunca sustituye a los campos estructurados.

### Scoring y financiación

- El **Car Score** es una ayuda a la decisión, 0–100, con un `breakdown` que debe *explicar* el número ("92 porque está por debajo del precio de mercado…", nunca un "92" a secas). Las fórmulas están versionadas (`scoring/engine.py`, `rules/`, `versions/`). La V1 son reglas deterministas; las versiones estadísticas/ML llegan mucho más tarde. Nunca uses IA generativa para inventar especificaciones o precios.
- Los **cálculos de financiación deben ser deterministas y estar cubiertos por tests unitarios** — es obligatorio según PLAN.md FASE 6.

## Herramientas y comandos

Todo se ejecuta **dentro de Docker** (el host no necesita Python ni Node; el Python local es 3.14,
incompatible con Django 5.2).

| | Backend | Frontend |
|---|---|---|
| Test | `pytest` (pytest-django) | `npm run test` (Vitest + Testing Library) · `npm run test:e2e` (Playwright, Node en el host + stack levantado) |
| Lint | `ruff check .` | `npm run lint` (ESLint) |
| Formato | `ruff format .` (sustituye a Black, ADR 0005) | `npm run format` (Prettier) |
| Tipos | `mypy .` (progresivo, no 100%) | `npm run typecheck` (TypeScript strict) |

```bash
docker compose up --build                                   # levanta db + backend + frontend
docker compose run --rm backend pytest
docker compose run --rm backend python manage.py makemigrations
docker compose run --rm backend python manage.py migrate
docker compose run --rm frontend npm run test
```

Un solo test: `docker compose run --rm backend pytest apps/core/tests/test_health.py::test_health_devuelve_ok`
· `docker compose run --rm frontend npm run test -- src/components/ui/button.test.tsx`.

Atajos con `make` (opcional): `make up`, `make test`, `make lint`, `make check`, `make help`.

No persigas una cobertura arbitraria; prioriza el código crítico (normalizadores, scoring,
financiación, parsers, deduplicación). La CI (`.github/workflows/ci.yml`) ejecuta en cada PR:
backend (ruff, mypy, `makemigrations --check`, pytest con Postgres) y frontend (eslint, tsc,
vitest, build). `main` debe permanecer desplegable.

## Convenciones de trabajo

- Ramas git: `main`, `feature/*`, `fix/*`. Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Commits pequeños y con alcance lógico.
- Registra las decisiones técnicas relevantes como ADRs numerados en `docs/decisions/`.
- **Antes de integrar cualquier fuente externa**, revisa sus términos y crea `docs/data-sources/<fuente>.md` (tipo de integración, términos revisados, uso comercial, imágenes, rate limit, autenticación, campos, limitaciones, fecha de última revisión). Nunca asumas que una web se puede scrapear o que sus datos se pueden republicar solo porque sea técnicamente posible. La versión personal y la futura versión pública pueden usar conjuntos de fuentes distintos.
- `POST /api/v1/listings/import/` recibe una URL proporcionada por el usuario — la protección SSRF es obligatoria; el servidor no debe poder solicitar URLs internas arbitrarias.
- La autenticación empieza con email + contraseña. Sin OAuth (Google/Apple) hasta que una fase lo necesite.
- No añadas caché antes de medir una necesidad real.


## Reglas operativas adicionales

### Contexto y flujo de trabajo

Para tareas acotadas: `buscar → leer solo lo relevante → modificar → validar`. No releas todo el repositorio ni todos los documentos de planificación en cada tarea.

Antes de modificar código:

1. identifica la fase y objetivo en `PLAN.md`;
2. localiza los archivos afectados;
3. implementa el cambio mínimo completo;
4. ejecuta las validaciones relevantes;
5. actualiza `PLAN.md`/documentación solo si corresponde;
6. resume qué se hizo, qué se validó y qué queda pendiente.

No te adelantes a fases futuras por iniciativa propia.

### Definition of Done

Una tarea está terminada cuando, según aplique:

- funciona e está integrada;
- tests relevantes pasan;
- lint y typecheck pasan;
- migraciones están creadas y comprobadas;
- build/Docker no se rompen;
- documentación y `PLAN.md` reflejan el estado real.

No marques como completada una implementación parcial.

### Dinero y datos externos

Para cantidades monetarias usa `Decimal`, nunca `float`. No redondees prematuramente y mantén separados precio al contado, precio financiado, entrada, importe financiado, cuotas, comisiones, productos y coste total.

Los anuncios pueden contener datos ausentes o incorrectos: no inventes valores ni conviertas ausencia en `0`; usa `null`/`unknown` cuando corresponda. Valida todo dato externo antes de usarlo en lógica de negocio. `Listing.raw_data` conserva el original, pero la lógica principal usa campos normalizados.

### Acciones que requieren instrucción explícita

No realices por iniciativa propia:

- despliegues en producción o cambios destructivos de datos;
- sustitución del stack;
- contratación/activación de SaaS o APIs de pago;
- scraping masivo;
- incorporación de proveedores de IA;
- publicación en Play Store o App Store.

Si detectas deuda técnica ajena a la tarea actual, propónla para después en vez de hacer un refactor amplio.

## Disciplina de la hoja de ruta

Trabaja las fases en orden (FASE 0 → 8 para el MVP personal). **Después de la FASE 8, párate y evalúa el producto con datos de uso reales** — no continúes automáticamente con el resto de la hoja de ruta. El MVP solo tiene "éxito" si, durante una búsqueda real de coche, sustituye el flujo de hoja de cálculo y pestañas del navegador y saca a la luz al menos una diferencia no evidente entre candidatos.

Ver [ARCHITECTURE.md](ARCHITECTURE.md) §27 para los diez principios que no deben romperse.
