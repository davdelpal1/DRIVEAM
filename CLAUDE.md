# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Idioma: la documentación, el producto y las respuestas de trabajo en este repositorio son en **español (España)**.

## Estado del proyecto

**FASE 3 completada.** Sobre la FASE 2 (autenticación por sesión de Django + `/api/v1/preferences/`),
la FASE 1 (modelo de dominio + API del catálogo + `/catalogo`) y la FASE 0 (monorepo, Docker
Compose `db`+`backend`+`frontend`, CI): alta manual de candidatos. Backend: `Listing.owner`
(nulable) + `Listing.archived_at` + `Listing.url` opcional; endpoint plano
`GET·POST·PATCH·DELETE /api/v1/candidates/` en `apps/listings` (filtrado por `owner`) con
acciones `archive`/`unarchive`/`favorite`/`unfavorite` y capa de servicio
`apps/listings/services.py` (crea `Vehicle`+`Listing`+`Seller`+`UserVehicleNote` en una
transacción; fuente sintética `manual`). Frontend: `/candidatos` (listado con acciones),
`/candidatos/nuevo`, `/candidatos/[id]/editar`, feature `src/features/candidates`, enlace en
la cabecera y guard en `src/proxy.ts`. Ver `docs/decisions/0008` y
`docs/data-sources/manual.md`. Auth: endpoints `auth/{csrf,register,login,logout,me}` en
`apps/accounts`, rate limiting y flag `DJANGO_REGISTRATION_ENABLED`; `AuthProvider` + `apiMutate`
con `X-CSRFToken`. E2E con Playwright (job `e2e` en CI). Arranque: `cp .env.example .env` &&
`docker compose up --build`. Remoto: `github.com/davdelpal1/DRIVEAM`.

**Siguiente:** FASE 4 de [PLAN.md](PLAN.md) — dashboard "Mis coches": tarjetas/listado con
filtros, ordenación y estados de seguimiento personal (NEW/INTERESTED/CONTACTED/VISIT/
DISCARDED/PURCHASED).

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
                     scoring; comparisons llega en la FASE 5. api.py = serializers + viewsets
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
