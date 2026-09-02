# 0011 — Calculadora de financiación (FASE 6)

- **Estado:** aceptada
- **Fecha:** 2026-09-02

## Contexto

La FASE 6 de [PLAN.md](../../PLAN.md) pide mostrar en euros el coste real de financiar cada
candidato: a partir de las condiciones anunciadas (entrada, cuota, número de cuotas, cuota
final, comisión de apertura, productos, TIN/TAE) calcular el total en cuotas, el coste total
del coche pagándolo financiado, la diferencia frente al contado y el coste anual aproximado.
CLAUDE.md marca estos cálculos como **deterministas y con tests unitarios obligatorios**, y
exige `Decimal` para todo importe y no convertir la ausencia de dato en `0`.

El modelo `FinanceOffer` (`backend/apps/finance/models.py`) ya existía con todos los campos
necesarios; hasta ahora solo se exponía anidado de solo lectura en `ListingSerializer`. Su
escritura y la calculadora estaban aplazadas explícitamente a esta fase.

## Decisión

1. **El cálculo vive en el backend.** `apps/finance/calculator.py` contiene una función pura
   `compute_breakdown(...)` con `Decimal`, sin dependencias de Django, y un `dataclass`
   `FinanceBreakdown`. Es la única fuente de verdad; el frontend solo envía condiciones y
   pinta el resultado. Así los tests obligatorios (pytest) cubren la lógica de dinero sin
   riesgo de divergencia con una segunda implementación en TypeScript.

2. **Método V1 = "valores anunciados".** El total en cuotas es `cuota * nº de cuotas` más la
   cuota final; **no** se recalcula la cuota a partir del TIN. Comparar la cuota anunciada
   con la teórica del TIN/TAE es una comprobación útil pero se deja para una V2 (los
   parámetros `tin`/`tae` ya se aceptan y se guardan).

3. **Reglas de datos ausentes.** Si a una métrica le falta un insumo, esa métrica es `None`
   (nunca `0`). Excepción documentada: la entrada, la comisión de apertura y los productos
   ausentes se tratan como `0` (no hay coste conocido por ese concepto); el cuadro de cuotas
   —`monthly_payment` + `number_of_payments`— sí es obligatorio para cualquier resultado.
   `amount_financed` se deriva de `precio contado - entrada` solo si no se da explícito.

4. **`Decimal` sin redondeo intermedio.** Solo se cuantiza el resultado final a 2 decimales
   con `ROUND_HALF_UP`.

5. **Dos endpoints, ningún modelo nuevo ni migración.**
   - `POST /api/v1/finance/calculate/` (sin estado): valida condiciones sueltas y devuelve
     `{"breakdown": …}`. Alimenta la previsualización en vivo del formulario.
   - `GET·PUT·DELETE /api/v1/candidates/{id}/finance/` (acción de `CandidateViewSet`):
     una oferta por candidato (alta manual = 1 anuncio), `update_or_create` sobre el
     `listing`. `GET` sin oferta responde `204`.
   `FinanceOfferSerializer` pasa a escribible y añade un campo calculado `breakdown`.

6. **Fila nueva en el comparador.** `CandidateSerializer` expone `finance_total_cost` y
   `finance_difference_vs_cash` (calculados desde la oferta prefetch). `comparison.ts` gana
   la fila "Coste total financiado" (`best: "min"`, indicador "Menor coste total"); los
   candidatos sin oferta se ignoran en esa fila (ya lo hacía `bestIds` con los `null`).
   Cierra el punto pendiente del ADR [0010](0010-comparador.md).

7. **UI: una página por candidato.** `/candidatos/[id]/financiacion` con el formulario de
   condiciones y un panel lateral de "coste real" que se actualiza con debounce mientras se
   escribe. Enlaces desde la tarjeta del dashboard, la ficha de edición y la cabecera de
   columna del comparador. El precio al contado se muestra desde el anuncio (no se edita
   aquí).

## Alternativas consideradas

- **Cálculo en el frontend** (como la FASE 5): más rápido de montar, pero obliga a duplicar
  la lógica de dinero o a renunciar a los tests deterministas obligatorios. Descartada.
- **App `finance` con viewset REST completo** (`/api/v1/finance-offers/`): más genérico,
  pero hoy solo hay una oferta por candidato manual; la acción anidada es más simple y evita
  un contrato adicional. Aplazada hasta que la importación por URL (FASE 8) traiga varias
  ofertas por anuncio.
- **Recalcular la cuota desde el TIN en la V1**: aporta una comprobación de coherencia, pero
  requiere fijar la convención de amortización (francesa, con/sin carencia…) antes de tener
  datos reales. Aplazada a la V2.

## Consecuencias

- `/candidatos/[id]/financiacion` cubre la Definición de Terminado de la FASE 6: el usuario
  ve en euros el coste real y la diferencia frente al contado.
- El flujo (calcular → guardar → persistir → fila del comparador) queda cubierto por
  `frontend/e2e/finance.spec.ts` en el job `e2e` de CI. Para que la suite E2E no agote el
  límite de registro (`5/hour`), este pasa a configurarse por entorno
  (`DJANGO_THROTTLE_AUTH_REGISTER`) y `.env.example` lo sube en desarrollo.
- El comparador ya distingue candidatos por coste total financiado.
- A revisar cuando: la FASE 7 use la financiación como factor del Car Score, la FASE 8
  traiga ofertas desde fuentes externas (varias por anuncio), o se quiera la comprobación
  cuota-vs-TIN (V2).
