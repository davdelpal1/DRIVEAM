# 0005 — Gestión de dependencias del backend con pyproject.toml + pip

- **Estado:** aceptada
- **Fecha:** 2026-08-28

## Contexto

El backend necesita declarar dependencias de runtime y de desarrollo de forma reproducible,
sin añadir herramientas que el equipo (una persona) tenga que instalar y mantener. El proyecto
prioriza "sin sobreingeniería" (`ARCHITECTURE.md` §1).

## Decisión

- Un único `backend/pyproject.toml` (PEP 621) declara las dependencias de runtime y un grupo
  opcional `[project.optional-dependencies].dev` con las de desarrollo.
- Se instala con `pip install -e ".[dev]"` (o `pip install ".[dev]"` en Docker).
- La configuración de Ruff, mypy y pytest vive también en `pyproject.toml`.
- Formato de código: **`ruff format`** (equivalente a Black, admitido por `ARCHITECTURE.md` §20),
  evitando una dependencia adicional.
- La reproducibilidad exacta en CI/producción se consigue fijando versiones con topes
  (`>=x,<y`) y, si hace falta más adelante, `pip-tools` para generar un lockfile.

## Alternativas consideradas

- **Poetry** — muy extendido, pero es una herramienta más que instalar y su resolver ha dado
  problemas de rendimiento; su `pyproject` no es estándar del todo.
- **uv** — rápido y con lockfile, pero aún joven y hay que instalarlo fuera de la imagen base.
  Reevaluable en el futuro: la migración desde `pyproject.toml` estándar sería sencilla.
- **`requirements.txt` planos** — sin separación clara runtime/dev ni metadatos del proyecto.

## Consecuencias

- Sin lockfile de entrada: se asume pin por rangos hasta que la reproducibilidad estricta sea
  una necesidad medida (entonces `pip-tools` o `uv`).
- Una sola fuente de verdad para dependencias y configuración de herramientas.
