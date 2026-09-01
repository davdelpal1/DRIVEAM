# 0006 — Forma del modelo de dominio y de su API (FASE 1)

- **Estado:** aceptada
- **Fecha:** 2026-08-28

## Contexto

La FASE 1 de [PLAN.md](../../PLAN.md) introduce el modelo de dominio: 10 modelos, 5
enumeraciones y una API REST. `ARCHITECTURE.md` §6 fija los campos orientativos y §27 los
principios innegociables (`Vehicle` ≠ `Listing`, ninguna fuente controla el dominio, cálculos
financieros reproducibles, scores explicables y versionados). CLAUDE.md obliga a implementar el
**cambio mínimo completo** sin adelantar fases futuras. Quedan varias decisiones abiertas:
alcance de la API, permisos antes de que exista autenticación (FASE 2), dónde viven las
enumeraciones y el idioma de sus valores.

## Decisión

1. **Una app por dominio** (`sources`, `vehicles`, `listings`, `finance`, `favorites`,
   `scoring`); `UserPreference` vive en `accounts`. Base común `TimestampedModel` (abstracta) en
   `apps.core` para `created_at` / `updated_at`.
2. **Se definen los 10 modelos y las 5 enumeraciones ahora** (es el entregable de la fase), con
   migraciones aplicadas.
3. **La API REST con CRUD completo se limita al catálogo de dominio**: `Source`, `Seller`,
   `Vehicle`, `Listing`. Los modelos con dueño (`Favorite`, `UserVehicleNote`, `UserPreference`,
   `Score`) y `ListingSnapshot` se crean como **modelo + admin**, sin endpoint: su API es de su
   fase (2, 3, 7 y 9). `FinanceOffer` se expone solo **anidado de solo lectura** dentro de
   `Listing`; su endpoint escribible y los cálculos deterministas son la FASE 6.
4. **Permisos provisionales `IsAuthenticatedOrReadOnly`** en esos cuatro viewsets. Todavía no
   hay autenticación (FASE 2): el frontend necesita leer el catálogo y la escritura queda tras
   una sesión de superusuario (admin de Django o API navegable de DRF). La FASE 2 revisa
   permisos y ámbito por usuario.
5. **Enumeraciones co‑locadas** en `enums.py` de cada app, como `models.TextChoices`, con
   etiquetas en español (España) y valores en slug minúsculo estable (`"gasolina"`, `"diesel"`,
   `"user_import"`…). El valor es el contrato de la API; la etiqueta es para la interfaz.
6. **`django-filter`** como backend de filtros (junto a `OrderingFilter` y `SearchFilter` de
   DRF). El serializador de `Listing` acepta `vehicle`/`source`/`seller` por clave primaria en
   escritura y devuelve además su representación anidada (`*_detail`) para evitar peticiones
   encadenadas desde el frontend.
7. **Sin unicidad sobre `Vehicle`**: la deduplicación es la FASE 12. Sí unicidad parcial
   `(source, external_id)` en `Listing` y `Seller` cuando `external_id` no está vacío.

## Alternativas consideradas

- **API para los 10 modelos ya** — construye superficie (favoritos, notas, preferencias, score)
  antes de que exista el usuario autenticado y el ámbito por usuario; parte habría que
  rehacerla en la FASE 2. Descartada por la disciplina de hoja de ruta.
- **`AllowAny` en el catálogo** — dejaría `main` con una API de escritura abierta si se
  despliega; entra en conflicto con `ARCHITECTURE.md` §14. Descartada.
- **Enumeraciones en un módulo compartido `apps/core/enums.py`** — acopla apps que no se
  necesitan entre sí y crea un punto único de cambio. Se prefiere co‑locarlas.
- **Valores de enum en inglés** — más neutro, pero el producto y su documentación son en
  español (CLAUDE.md) y no se prevé i18n del backend. Descartada por coherencia.

## Consecuencias

- El dominio queda completo y consultable; la FASE 2 puede centrarse en autenticación y
  preferencias sin volver a tocar el modelo.
- Añadir un endpoint diferido (p. ej. favoritos) es registrar un viewset en
  `config/api_router.py`; el modelo y el admin ya existen.
- Coste asumido: hay que revisar los `permission_classes` de los cuatro viewsets en la FASE 2,
  y `django-filter` es una dependencia más que mantener.
- A revisar cuando: la deduplicación (FASE 12) quiera una clave natural en `Vehicle`; o el
  Score V2 (FASE 19) necesite otra forma para `breakdown` / `version`.
