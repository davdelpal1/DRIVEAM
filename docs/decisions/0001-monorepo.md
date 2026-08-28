# 0001 — Monorepo único para frontend, backend y documentación

- **Estado:** aceptada
- **Fecha:** 2026-08-28

## Contexto

DRIVEAM tiene, desde el inicio, un frontend (Next.js) y un backend (Django) que evolucionan
de forma acoplada durante el MVP: un cambio de modelo de dominio suele tocar API y UI a la vez.
El equipo es de una sola persona en la fase personal. `ARCHITECTURE.md` §3 ya propone monorepo.

## Decisión

Todo el código vive en un único repositorio Git (`davdelpal1/DRIVEAM`) con carpetas de nivel
superior por área: `frontend/`, `backend/`, `docs/`, `scripts/`. No se usa ninguna herramienta
de gestión de monorepo (Nx, Turborepo, workspaces): solo carpetas y cada subproyecto con su
propio gestor de dependencias.

## Alternativas consideradas

- **Repositorios separados (poly-repo)** — sincronizar cambios de contrato API entre dos repos
  añade fricción (PRs cruzados, versionado) sin beneficio real con un solo desarrollador.
- **Monorepo con Nx/Turborepo** — orquestación y caché de tareas que no necesitamos todavía;
  añade configuración y una curva de aprendizaje. Se puede introducir más adelante sin cambiar
  la estructura de carpetas.

## Consecuencias

- Un solo `git clone`, un solo pipeline de CI, cambios atómicos frontend + backend.
- El CI debe distinguir qué job ejecutar según la carpeta afectada (aceptable con dos jobs).
- Si en el futuro el backend se divide en servicios, se reevaluará (ver `ARCHITECTURE.md` §1:
  la complejidad se introduce cuando hay necesidad medida).
