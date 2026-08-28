# 0004 — Patrón Source Adapter para las fuentes de datos

- **Estado:** aceptada
- **Fecha:** 2026-08-28

## Contexto

DRIVEAM agrega vehículos de fuentes heterogéneas (entrada manual, importación por URL, API,
feed, scraper autorizado). El producto **no debe depender de ninguna fuente concreta**
(`PROJECT_VISION.md` §13, `ARCHITECTURE.md` §7 y §27.2). Cada fuente tiene además condiciones
legales propias que pueden cambiar.

## Decisión

Toda fuente se integra implementando una interfaz común, registrada en un `registry`:

```python
class SourceAdapter:
    def can_handle(self, url: str) -> bool: ...
    def fetch_listing(self, url: str) -> RawListing: ...
    def normalize(self, raw: RawListing) -> NormalizedListing: ...
```

El resto de la aplicación (API, servicios de dominio, frontend) consume únicamente datos
normalizados y **no sabe** cómo se obtuvieron. El pipeline de ingesta es:
`SourceAdapter → Raw → Validator → Normalizer → Deduplicator → Vehicle + Listing → Snapshot → Scoring`.
Un scraper es solo una implementación de `SourceAdapter`, no parte del dominio.

La implementación concreta llega en la **FASE 8**; este ADR fija el patrón para que las fases
previas no introduzcan acoplamientos que lo impidan.

## Alternativas consideradas

- **Lógica de scraping/parsing dentro de las vistas o modelos** — acopla el dominio a una web
  concreta; cualquier cambio de esa web rompe el núcleo. Prohibido por `ARCHITECTURE.md` §27.3.
- **Un cliente por fuente sin interfaz común** — impide intercambiar fuentes y duplicar el
  pipeline de validación/normalización.

## Consecuencias

- Cada fuente añade un módulo aislado en `backend/apps/sources/<fuente>/` + tests con fixtures
  HTML/JSON + un documento en `docs/data-sources/<fuente>.md`.
- Se puede pasar de scraper a API/feed para una misma fuente sin tocar el dominio.
- Coste: una capa de indirección (adapter + normalizador) incluso para la entrada manual.
