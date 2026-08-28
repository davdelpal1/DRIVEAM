# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Idioma: la documentación, el producto y las respuestas de trabajo en este repositorio son en **español (España)**.

## Estado del proyecto

Este repositorio contiene **solo documentos de planificación** — no hay código, ni `frontend/`, ni `backend/`, ni `docker-compose.yml`, y todavía no es un repositorio git. La implementación no ha empezado; el primer trabajo es la **FASE 0** de [PLAN.md](PLAN.md) (montar el monorepo, el frontend Next.js, el backend Django, Docker Compose y CI).

Los cuatro documentos que son fuente de verdad, en orden de lectura:

- [README.md](README.md) — problema, propuesta de valor, alcance del MVP, stack
- [PROJECT_VISION.md](PROJECT_VISION.md) — visión de producto, Jobs To Be Done, diseño del Car Score, estrategia de datos
- [ARCHITECTURE.md](ARCHITECTURE.md) — arquitectura lógica, modelo de datos, patrón de adaptadores, principios innegociables (§27)
- [PLAN.md](PLAN.md) — hoja de ruta por fases; cada fase debe terminar con software utilizable

La moneda es EUR; la financiación usa términos españoles (TIN, TAE, cuota, entrada, cuota final). Mantén la documentación nueva y los textos de interfaz en español salvo que se pida lo contrario.

## Arquitectura prevista

Monorepo. Cliente web Next.js (TypeScript strict, Tailwind) → API Django REST Framework → PostgreSQL. Celery + Redis están **aplazados** y no deben aparecer hasta que una fase los necesite de verdad (ver PLAN.md FASE 10).

```
frontend/            Next.js — organizar por feature, no un components/ plano
backend/
  config/            configuración del proyecto Django
  apps/              una app por dominio: accounts, vehicles, listings, sources,
                     favorites, comparisons, finance, scoring
docs/decisions/      ADRs (Contexto / Decisión / Alternativas / Consecuencias)
docs/data-sources/   un fichero por fuente externa (ver más abajo)
```

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

## Herramientas (a configurar en la FASE 0)

Nada de esto está montado todavía. Al hacer el scaffold, la cadena de herramientas prevista es:

| | Backend | Frontend |
|---|---|---|
| Test | pytest, pytest-django | Vitest, Testing Library, Playwright (E2E) |
| Lint | Ruff | ESLint |
| Formato | Black (o equivalente) | Prettier |
| Tipos | mypy (progresivo, no 100%) | TypeScript strict |

El stack completo debe arrancar con `docker compose up` (frontend + backend + postgres) tras una configuración inicial documentada. No persigas una cobertura arbitraria; prioriza el código crítico (normalizadores, scoring, financiación, parsers, deduplicación).

CI (GitHub Actions) en cada PR: frontend lint + typecheck + tests, backend lint + tests, comprobación de migraciones. `main` debe permanecer desplegable.

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
