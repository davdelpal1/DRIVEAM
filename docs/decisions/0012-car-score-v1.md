# 0012 — Car Score V1 (FASE 7)

- **Estado:** aceptada
- **Fecha:** 2026-09-02

## Contexto

La FASE 7 de [PLAN.md](../../PLAN.md) pide una puntuación **0-100** que ordene los candidatos
según las prioridades del usuario, con **reglas deterministas**, **pesos configurables**, un
**desglose que explica el número** (PROJECT_VISION §6.6: nunca un "87" a secas) y **versión del
algoritmo**. Hasta ahora `CandidateSerializer` devolvía `score: null` y el frontend pintaba
`—`. El modelo `Score` (`apps/scoring/models.py`) existía desde la FASE 1 sin uso.

Definición de Terminado: dos usuarios con prioridades distintas obtienen rankings distintos.

## Decisión

1. **Motor puro en el backend.** `apps/scoring/engine.py` contiene `compute_score(inputs,
   weights) -> ScoreBreakdown`, sin dependencias de Django (igual que
   `apps/finance/calculator.py`). `Decimal` sin redondeo intermedio, entero final
   `ROUND_HALF_UP`. Versión: `SCORE_VERSION = "v1"`.

2. **Factores V1: precio, kilómetros, antigüedad, financiación y garantía.** `fiabilidad`
   (sin fuente de datos fiable) y `consumo` (sin dato hasta la FASE 8) quedan fuera: sus
   pesos siguen en el modelo pero el motor los ignora y los declara en `missing`.

3. **Cada factor se puntúa contra las preferencias del usuario**
   (`budget_target`/`budget_max`, `min_year`, `max_mileage`) y, si la preferencia no está
   fijada, con una **curva de reserva**. Excepción honesta (PROJECT_VISION §6.7): un precio
   sin ninguna referencia de presupuesto **no se puntúa** (factor ausente), en vez de
   inventar una escala de mercado que la V1 no tiene.

4. **Un factor sin insumo no cuenta como 0.** Se excluye del reparto y su peso se
   redistribuye entre los presentes (normalización sobre los factores con dato). Si la suma
   de pesos presentes es 0 → reparto uniforme.

5. **Se añade `weight_warranty` a `UserPreference`** (migración `accounts/0004`, `default=5`,
   como la tabla de PROJECT_VISION §7). Se expone en `/api/v1/preferences/` y en el
   formulario de preferencias.

6. **Se persiste en el modelo `Score`** (`update_or_create` por `listing` + `user` +
   `version`), no cálculo al vuelo. El recálculo se dispara desde: alta/edición de candidato
   (`apps/listings/services.py`), oferta de financiación
   (`CandidateViewSet.finance` PUT/DELETE), guardado de preferencias
   (`UserPreferenceView.perform_update` → todos los candidatos del usuario) y, como red de
   seguridad, la primera lectura sin fila `Score` (`CandidateSerializer`). `apps/scoring/
   services.py` es el puente (lee `Vehicle`/`Listing`/`FinanceOffer` + `UserPreference`,
   `reference_year = date.today().year`).

7. **API sin endpoint nuevo.** `CandidateSerializer` expone `score` (entero) y
   `score_breakdown` (el `breakdown` guardado). El dashboard, el comparador y la nueva
   página `/candidatos/[id]/score` consumen `GET /api/v1/candidates/{id}/`.

8. **Frontend:** feature `src/features/scoring` (`score-format.ts` puro y testeado,
   `ScoreBadge`, `ScoreBreakdownPanel`) y página `/candidatos/[id]/score` con la explicación
   por factores. Enlaces desde la tarjeta del dashboard y la ficha. La fila `score` del
   comparador (ya existente) se rellena sola.

## Alternativas consideradas

- **Cálculo al vuelo sin persistir** (como la FASE 6): menos infraestructura y nunca hay
  score obsoleto, pero se pierde el historial de puntuaciones y no encaja con el scoring
  asíncrono de la FASE 10. Descartada a favor de persistir con disparadores + red de
  seguridad.
- **Peso interno fijo para la garantía** (sin tocar `UserPreference`): evita la migración
  pero incumple "pesos configurables" para ese factor. Descartada.
- **Curvas heurísticas absolutas iguales para todos** (umbrales fijos de km/año/precio):
  más simple, pero los rankings solo dependerían de las prioridades a través de los pesos,
  no de los umbrales del usuario. Descartada: debilita la Definición de Terminado.
- **Normalización estadística contra cohortes de mercado**: es la V2 (FASE 19); requiere
  datos históricos que aún no existen.

## Consecuencias

- `/candidatos/[id]/score` cubre la Definición de Terminado: cambiando los pesos en
  `/perfil` cambian las puntuaciones y el orden del dashboard.
- Cada guardado de preferencias recalcula el `Score` de todos los candidatos del usuario
  (dataset personal pequeño; si crece, mover a la cola de la FASE 10).
- A revisar cuando: la FASE 8 traiga `consumo` y varias ofertas por anuncio, la FASE 10
  mueva el scoring a Celery, o se aborde la Score V2 (FASE 19).
