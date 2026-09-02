# 0010 — Comparador de candidatos (FASE 5)

- **Estado:** aceptada
- **Fecha:** 2026-09-02

## Contexto

La FASE 5 de [PLAN.md](../../PLAN.md) pide comparar entre 2 y 5 coches en una tabla con
columnas fijas en desktop, usable en móvil, e indicadores del tipo "menor precio ✓",
"menos km ✓", "más nuevo ✓", "mejor score ✓". Los datos que hay que comparar (precio, año,
km, potencia, financiación, garantía, vendedor, score) ya los expone
`CandidateSerializer` (ADR [0009](0009-dashboard-mis-coches.md)); no hace falta backend nuevo.

## Decisión

1. **Feature solo de frontend.** No hay endpoint, modelo ni migración. La página
   `/candidatos/comparar` reutiliza `GET /api/v1/candidates/` (todos los candidatos del
   usuario; dataset personal pequeño) y filtra los seleccionados por la query `?ids=1,2,3`.
   Es la misma decisión que en el dashboard: comparar decenas de filas en el navegador es
   instantáneo y evita estado en servidor. No se crea la app `comparisons` que insinuaba la
   estructura prevista: no hay nada que persistir todavía.

2. **Selección desde el dashboard.** Cada tarjeta de "Mis coches" gana una casilla
   "Comparar"; una barra fija (`sticky`) muestra el recuento y enlaza a
   `/candidatos/comparar?ids=…` cuando hay 2–5 marcados. El tope de 5 se aplica al marcar.

3. **Lógica pura y testeable en `comparison.ts`.** `COMPARISON_ROWS` describe cada fila
   (etiqueta, dirección de "lo mejor", indicador, extractor numérico y formateador).
   `bestIds(candidatos, fila)` devuelve los IDs que empatan en el mejor valor, con reglas
   explícitas: se ignoran los candidatos sin dato, no se compara con menos de dos valores y
   **si todos coinciden no se destaca nada** (no aporta información). `parseCompareIds`
   sanea la query. La tabla (`comparison-table.tsx`) solo pinta.

4. **Tabla con primera columna fija.** `overflow-x-auto` en el contenedor + `position:
   sticky; left: 0` en la primera celda de cada fila. En móvil la tabla hace scroll
   horizontal dentro de su tarjeta; el `<body>` nunca se desborda.

5. **`consumo` se queda fuera.** El modelo `Vehicle` no tiene consumo ni emisiones
   estructuradas; se añadirá con la importación por URL (FASE 8). El resto de criterios del
   plan sí están; `financiación` se cubre con la fila "Precio financiado" (los cálculos
   completos son la FASE 6) y `score` muestra "—" hasta la FASE 7.

## Alternativas consideradas

- **Comparación en servidor** (endpoint `/candidates/compare/?ids=`): más "correcto" pero
  redundante para el volumen actual y añade un contrato que mantener. Descartada.
- **App `comparisons` con comparaciones guardadas**: la métrica "comparaciones" de la FASE 14
  puede necesitarla, pero hoy nadie guarda una comparación. Aplazada.
- **Estado de selección en la URL del dashboard**: se optó por estado local + query solo en
  la página de comparar, coherente con el filtrado en cliente del dashboard.

## Consecuencias

- `/candidatos/comparar` cubre la Definición de Terminado de la FASE 5: el usuario ve en qué
  criterio destaca cada coche.
- La casilla "Comparar" convive con el `<select>` de estado y las acciones de cada tarjeta.
- A revisar cuando: la FASE 6 traiga el coste total financiado (nueva fila), la FASE 7
  rellene `score`, la FASE 8 aporte consumo/emisiones, o se quieran guardar comparaciones.
