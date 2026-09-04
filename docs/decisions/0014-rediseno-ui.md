# 0014 — Rediseño de interfaz (sistema de diseño y reskin completo)

- **Estado:** aceptada
- **Fecha:** 2026-09-04

## Contexto

Tras el MVP personal (FASES 0-8), la interfaz seguía siendo el andamiaje por defecto de
Next.js: sin paleta de color propia (solo blanco/negro y `zinc`), sin sistema de
componentes (solo `Button` e `Input`), clases utilitarias repetidas en cada pantalla, la
home todavía mostraba el panel de diagnóstico de la FASE 0 y contenedores de ancho
inconsistente. Antes de la evaluación con una búsqueda real de coche (disciplina de
hoja de ruta de CLAUDE.md), la interfaz debía dejar de ser un obstáculo para usar el
producto.

## Decisión

1. **Tokens de color por CSS custom properties**, definidos en `frontend/src/app/globals.css`
   y expuestos a Tailwind v4 con `@theme inline` (utilidades `bg-surface`, `text-muted`,
   `border-border`, `bg-primary`, etc., theme-aware sin variantes `dark:` sueltas). Paleta
   "automoción, moderno y confiable": azul (`--primary`) + verde eléctrico (`--accent`) de
   apoyo, superficie/borde/texto neutros, semánticos `success/warning/danger`. Modo oscuro
   por `prefers-color-scheme` **y** por `data-theme` (toggle manual en la cabecera,
   persistido en `localStorage`, con script anti-flash inline en `layout.tsx`).

2. **Sistema de componentes** en `frontend/src/components/ui/`: `Card`, `Badge`, `Select`,
   `Textarea`, `Field`/`Fieldset`, `Alert`, `Stat`, `EmptyState`, `PageHeader`, además de
   `Button`/`Input` reescritos. `buttonClass()` permite que un `<Link>` comparta el estilo
   del botón sin duplicar clases. `Container` fija el ancho central de página.

3. **Reskin completo** de las pantallas (home ahora es una landing real; el panel de
   diagnóstico se movió a `/estado`), sin tocar lógica de negocio, helpers puros
   (`score-format.ts`, `comparison.ts`, `dashboard-filters.ts`, `finance/format.ts`) ni
   contratos de API. Se preservó explícitamente todo nombre accesible y texto que consultan
   los tests: la tarjeta de candidato sigue siendo un `<article>` con las mismas etiquetas
   (`Marca`, `Estado`, `Comparar`…) y botones (`Favorito`, `Archivar`, `Eliminar`…), todos
   visibles (ninguna acción se colapsó en un menú).

## Alternativas consideradas

- **Librería de componentes de terceros** (shadcn/ui, Radix): descartada por ahora; el
  catálogo de componentes necesario es pequeño y una dependencia nueva no estaba pedida
  explícitamente.
- **Sustituir Tailwind** por CSS Modules: descartado; Tailwind ya está integrado y el
  problema no era la herramienta sino la ausencia de un sistema de tokens/componentes.

## Consecuencias

- Toda pantalla nueva debe construirse con `Container`/`PageHeader`/`Card` y los
  componentes de `components/ui/`, no con clases sueltas repetidas.
- Los 45 tests unitarios (Vitest) y los 6 escenarios E2E (Playwright) existentes pasan sin
  modificar su lógica, solo por preservarse los nombres accesibles.
- Pendiente (fuera de esta entrega): aplicar el mismo sistema si aparecen pantallas nuevas
  en FASE 9+.
