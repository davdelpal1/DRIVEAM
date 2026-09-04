# 0013 — Importación por URL y primer Source Adapter (FASE 8)

- **Estado:** aceptada
- **Fecha:** 2026-09-03

## Contexto

La FASE 8 de [PLAN.md](../../PLAN.md) pide reducir el esfuerzo de dar de alta un candidato:
pegar un enlace, detectar la fuente, importar, **revisar** y guardar. Requisitos duros de
CLAUDE.md / [ARCHITECTURE.md](../../ARCHITECTURE.md) §7, §8, §14:

- patrón Source Adapter real (`can_handle` / `fetch` / `parse` + registry), con el resto de
  la aplicación ajeno a cómo se obtuvo el anuncio;
- endpoint `POST /api/v1/listings/import/` con **prevención de SSRF obligatoria** y errores
  estructurados;
- una primera fuente **técnica y legalmente** apta, documentada en `docs/data-sources/`;
- los datos importados se muestran para revisión **antes** de guardarse;
- traer el dato de `consumo` que la FASE 7 dejó pendiente en el Car Score.

## Decisión

1. **Paquete `apps/sources/adapters/`** con las piezas separadas y testeables:
   `base.py` (`SourceAdapter` ABC + `RawListing`), `errors.py` (jerarquía `ImportError` con
   `code` estable y `status_code`), `ssrf.py`, `fetch.py`, `normalize.py` (normalizadores
   puros), `registry.py` (registro + `import_listing()` = validar → descargar → parsear) y
   `structured_data.py` (primer adaptador). `parse()` es **pura** (HTML ya descargado, sin
   red): los tests usan fixtures HTML.

2. **Primera fuente: datos estructurados genéricos (`datos-estructurados`)**, no un portal
   concreto. Lee el JSON-LD de schema.org (`Vehicle` / `Car` / `Product`) y, como apoyo, las
   etiquetas Open Graph que la propia página publica para buscadores. Es la opción legalmente
   más conservadora para la fase de prueba: uso personal, datos que el usuario ya está
   viendo, sin scraping de HTML no estructurado ni republicación. Ver
   [docs/data-sources/datos-estructurados.md](../data-sources/datos-estructurados.md).

3. **SSRF (`validate_public_url`)**: solo `http(s)`, sin credenciales en la URL, puertos
   restringidos; se resuelve el DNS y **todas** las IPs deben ser públicas (se rechazan
   privadas, loopback, link-local —incluida `169.254.169.254`—, reservadas y multicast).
   Cada salto de redirección se vuelve a validar. `settings.IMPORT_ALLOW_PRIVATE_HOSTS`
   (env `DJANGO_IMPORT_ALLOW_PRIVATE_HOSTS`, **False** en producción) desactiva solo la
   comprobación de rango de IP, para desarrollo y E2E. `fetch.py` añade tiempo de espera,
   tamaño máximo y comprobación de `Content-Type`.

4. **Endpoint `POST /api/v1/listings/import/`** (`ListingImportView`, autenticado, throttle
   `listings-import` = `30/hour` configurable). **No persiste nada**: devuelve
   `{source, source_url, title, warnings, raw, candidate}` donde `candidate` ya tiene la
   forma del formulario de alta. Errores → `{"code", "detail"}` con 400 (`unsafe_url`), 422
   (`source_not_supported` / `unparseable_listing`) o 502 (`unfetchable_url`).

5. **Guardar reutiliza `POST /api/v1/candidates/`**: `CandidateSerializer` gana un campo
   `import_url` de solo escritura; si viene, `apps/listings/services.create_candidate` usa la
   fuente `datos-estructurados` y guarda la procedencia en `Listing.raw_data`
   (`{import_url, imported_at}`). Sin modelo ni migración nuevos en `listings`.

6. **`consumo` entra en el dominio y en el Car Score.** Nuevo `Vehicle.fuel_consumption`
   (L/100 km, `Decimal`, migración `vehicles/0002`). El motor
   (`apps/scoring/engine.py`) estrena el factor `consumption` (peso ya existente
   `weight_consumption`) con curva de reserva absoluta (≤4 excelente, ≥9 penaliza del todo);
   sin dato, el factor se excluye del reparto como los demás. `Consumo` sale de
   `DEFERRED_FACTORS` (solo queda `Fiabilidad`). El comparador estrena la fila
   "Consumo medio".

7. **Frontend:** feature `src/features/import` (`api.ts`, `import-wizard.tsx`) y página
   `/candidatos/importar` (pegar enlace → previsualización con avisos → `CandidateForm`
   precargado → guardar). `CandidateForm` acepta `initialValues` + `importUrl`. Enlaces
   desde el dashboard, el alta manual y el estado vacío.

## Alternativas consideradas

- **Adaptador para un portal español concreto** (Coches.net, Wallapop, Milanuncios…):
  encaja mejor con la idea de "detectar la fuente", pero obliga a asumir que sus términos
  permiten acceso automatizado y almacenamiento —cosa que varios prohíben expresamente— y a
  mantener un parser frágil de HTML. Se pospone a la FASE 13, con estudio de términos por
  fuente. El adaptador genérico ya deja montada toda la infraestructura para añadirlos.
- **Persistir en el propio endpoint de importación** (con un flag `confirm`): menos ida y
  vuelta, pero rompe "revisar antes de guardar" o duplica el formulario de edición.
  Descartada a favor de previsualización + alta normal.
- **Descargar en un worker (Celery)**: innecesario para una descarga de ~1 s; la FASE 10
  decidirá si el scoring/refresco lo justifican (principio §27.7).
- **Copiar imágenes del anuncio**: fuera de alcance y con dudas de derechos
  (ARCHITECTURE.md §18). No se guardan.

## Consecuencias

- Se puede añadir un candidato pegando una URL compatible (Definición de Terminado de la
  FASE 8). Las webs sin datos estructurados devuelven `unparseable_listing` y el usuario cae
  en el alta manual.
- **DNS rebinding**: entre la validación y la descarga `urllib` vuelve a resolver el dominio;
  la ventana es pequeña pero existe. Aceptable para uso personal; si se abre a más usuarios,
  fijar la conexión a la IP validada.
- Cada guardado de preferencias sigue recalculando el `Score` de todos los candidatos; ahora
  también entra el consumo.
- A revisar cuando: la FASE 9 traiga `ListingSnapshot` (el adaptador ya deja `raw`), la
  FASE 12 la deduplicación (una importación crea siempre un `Vehicle` nuevo) o la FASE 13
  fuentes concretas.
