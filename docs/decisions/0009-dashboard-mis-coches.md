# 0009 — Dashboard "Mis coches" (FASE 4)

- **Estado:** aceptada
- **Fecha:** 2026-09-02

## Contexto

La FASE 3 (ADR [0008](0008-candidatos-manuales.md)) dejó `/candidatos` como un listado simple:
tarjetas con editar / favorito / archivar / eliminar y una casilla "mostrar archivados". La
FASE 4 de [PLAN.md](../../PLAN.md) quiere convertir esa pantalla en el centro de gestión de la
búsqueda: filtros (precio, año, km, combustible, estado, favorito), ordenación (precio, score,
km, año, fecha de alta) y **estados de seguimiento personal** —
`NEW / INTERESTED / CONTACTED / VISIT / DISCARDED / PURCHASED` — cambiables en un clic.

El ADR 0008 §Consecuencias ya anticipaba esta fase ("¿mover parte de `candidates` a su propia
app? ¿tabla de seguimiento por usuario?").

## Decisión

1. **`TrackingStatus`** (`apps/listings/enums.py`) y **`Listing.tracking_status`** —
   `CharField` con `default=NEW`. Es el estado del *candidato para el usuario*, distinto de
   `ListingStatus` (estado del anuncio en su fuente) y de `archived_at`. Se guarda directamente
   en `Listing`, igual que `owner` y `archived_at`: un candidato manual tiene un solo dueño.
   Cuando la FASE 8 traiga anuncios compartidos sin `owner`, el seguimiento por-usuario se
   moverá a su propia tabla (`ListingTracking` o similar).

2. **Sin endpoint ni acción nuevos.** El cambio de estado va por el `PATCH
   /api/v1/candidates/{id}/` que ya existe: se añade `tracking_status` al `CandidateSerializer`
   y a `_LISTING_FIELDS` de `apps/listings/services.py`. El `CandidateSerializer` gana también
   `source` / `source_label` (slug y nombre de la fuente) y `score: null` (placeholder hasta la
   FASE 7).

3. **`CandidateFilter` ampliado** con `price_min/max`, `year_min/max`, `mileage_max`,
   `fuel_type`, `tracking_status` e `is_favorite`. Se mantiene por higiene de API y para el
   futuro, pero **el dashboard filtra y ordena en cliente**: la página ya carga todos los
   candidatos del usuario (dataset personal pequeño), así que filtrar en el navegador es
   instantáneo y evita recargas y estado en la URL. Helpers puros y testeables en
   `frontend/src/features/candidates/dashboard-filters.ts`.

4. **Sin foto todavía.** El modelo no tiene campo de imagen; la tarjeta usa un placeholder
   (inicial de la marca). Las imágenes llegan con la importación por URL (FASE 8).

5. **El estado solo se cambia desde el dashboard**, con un `<select>` por tarjeta. El
   formulario de alta/edición no lo toca: un candidato nace en `NEW`.

## Alternativas consideradas

- **Tabla de seguimiento por usuario desde ya**: correcta a largo plazo, pero hoy `Listing`
  tiene un único `owner` y añadir una tabla + join no aporta nada. Aplazada a la FASE 8.
- **Filtrado y orden en servidor** (querystring + recarga): más escalable, pero más lento, más
  código y peor UX para un dataset de decenas de filas. Descartada por ahora.
- **Acción dedicada `set_status`** al estilo de `archive`/`favorite`: el `PATCH` genérico ya
  cubre el caso sin código extra. Descartada.

## Consecuencias

- `/candidatos` ("Mis coches") cubre la Definición de Terminado de la FASE 4: ver, filtrar,
  ordenar y cambiar el estado de todos los candidatos desde una sola pantalla.
- `Score` sigue aplazado (FASE 7): la columna muestra "—" y el orden por score deja los nulos
  al final.
- El enlace de cabecera pasa de "Candidatos" a "Mis coches".
- A revisar cuando: la FASE 7 rellene `score`; la FASE 8 introduzca anuncios sin `owner` y haya
  que separar el seguimiento por usuario.
