# 0008 — Alta manual de candidatos (FASE 3)

- **Estado:** aceptada
- **Fecha:** 2026-09-01

## Contexto

La FASE 3 de [PLAN.md](../../PLAN.md) busca que DRIVEAM sustituya la hoja de cálculo: dar de
alta a mano un coche que se está valorando (marca, modelo, precio, km, notas…), editarlo,
eliminarlo, archivarlo y marcarlo como favorito, sin depender todavía del scraping.

La pantalla "Nuevo candidato" mezcla en un solo formulario campos de dos entidades que
`ARCHITECTURE.md` §27.1 obliga a mantener separadas: `Vehicle` (coche normalizado) y `Listing`
(el anuncio concreto). Hasta ahora `Listing` no tenía dueño (el ADR 0007 dejó la pregunta
"¿propiedad de `Listing`?" abierta para esta fase) y no existía ningún endpoint para este
flujo; los modelos `Favorite` y `UserVehicleNote` ya estaban definidos pero sin API.

## Decisión

1. **`Listing.owner`** — FK opcional a `User` (`on_delete=SET_NULL`). La rellena el alta
   manual; queda nula para los anuncios que en el futuro entren por scraping/importación, que
   alimentan un catálogo compartido. No se añade propiedad a `Vehicle`: los vehículos
   normalizados son compartidos por diseño.

2. **Endpoint plano `/api/v1/candidates/`** (`CandidateViewSet` en `apps/listings/api.py`,
   `IsAuthenticated`, queryset filtrado por `owner=request.user`). Un `CandidateSerializer`
   plano (no `ModelSerializer`) expone y acepta los campos de `Vehicle` y de `Listing` juntos;
   el frontend manda y recibe un único objeto. Acciones `POST` extra: `archive` / `unarchive`
   (conmutan `Listing.archived_at`) y `favorite` / `unfavorite` (crean/borran `Favorite`).

3. **Capa de servicio** (`apps/listings/services.py`): `create_candidate` / `update_candidate`
   / `delete_candidate` encapsulan la transacción que crea o edita `Vehicle` + `Listing` +
   `Seller` opcional + `UserVehicleNote`. No es un CRUD de una sola tabla, así que la capa está
   justificada (CLAUDE.md: "introduce una capa solo cuando la operación no sea trivial").
   `get_manual_source()` crea de forma perezosa la `Source` sintética con slug `manual`.

4. **`archived_at` en `Listing`** (timestamp nulable) en lugar de un booleano: registra *cuándo*
   se archivó y deja sitio a un histórico. Archivar es distinto de `Listing.status` (que
   describe el estado del anuncio en su fuente) y de los estados de seguimiento personal
   (NEW / INTERESTED / VISIT…) que llegan en la FASE 4.

5. **`Listing.url` pasa a opcional** (`blank=True`): un candidato tecleado a mano puede no
   tener enlace.

6. **Borrado**: al eliminar un candidato se borra su `Listing` y, si su `Vehicle` se queda sin
   anuncios, también el `Vehicle` (un alta manual = un vehículo + un anuncio).

## Alternativas consideradas

- **Reutilizar `/vehicles/` + `/listings/` desde el frontend** (dos llamadas encadenadas):
  menos código de backend, pero mete lógica de orquestación y estados intermedios en el
  cliente y complica el manejo de errores parciales. Descartada.
- **No dar dueño a `Listing`, tratar todo como del usuario único**: más simple hoy, pero
  obliga a una migración de datos en cuanto haya más de un usuario y choca con el dashboard
  multiusuario de la FASE 4. Descartada.
- **`is_archived` booleano**: más simple, pero pierde la fecha y no aporta nada frente al
  timestamp nulable.
- **Un modelo `Candidate` propio**: duplicaría `Vehicle`/`Listing` y rompería la separación de
  dominio y la deduplicación futura (FASE 12). Descartada.

## Consecuencias

- El usuario puede gestionar su búsqueda desde `/candidatos` (listado con archivar / favorito /
  editar / eliminar) y `/candidatos/nuevo` — cubre la Definición de Terminado de la FASE 3.
- `favorites` y `finance` siguen sin viewset propio: `Favorite` se maneja solo vía acciones de
  `candidates`; la escritura de `FinanceOffer` sigue aplazada a la FASE 6.
- El `CandidateSerializer` plano queda fuera del contrato "un serializer por modelo": es
  deliberado, es una vista de presentación de un caso de uso.
- A revisar cuando: la FASE 4 añada estados de seguimiento y filtros/orden en el dashboard
  (¿mover parte de `candidates` a su propia app?); la FASE 8 conecte adaptadores reales y haya
  anuncios sin `owner` conviviendo con los manuales.
