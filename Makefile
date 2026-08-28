# DRIVEAM — atajos de desarrollo.
# Conveniencia opcional: todos los comandos equivalentes en crudo están en el README.
# En Windows requiere `make` (WSL, Git Bash con make, o Chocolatey).

COMPOSE ?= docker compose

.DEFAULT_GOAL := help
.PHONY: help up down build logs ps restart \
        migrate makemigrations superuser backend-shell \
        test test-backend test-frontend lint format check

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

up: ## Levanta todo el stack (db + backend + frontend)
	$(COMPOSE) up

build: ## Reconstruye las imágenes
	$(COMPOSE) build

down: ## Para y elimina los contenedores
	$(COMPOSE) down

logs: ## Sigue los logs de todos los servicios
	$(COMPOSE) logs -f

ps: ## Estado de los servicios
	$(COMPOSE) ps

restart: ## Reinicia backend y frontend
	$(COMPOSE) restart backend frontend

migrate: ## Aplica migraciones
	$(COMPOSE) run --rm backend python manage.py migrate

makemigrations: ## Genera migraciones
	$(COMPOSE) run --rm backend python manage.py makemigrations

superuser: ## Crea un superusuario
	$(COMPOSE) run --rm backend python manage.py createsuperuser

backend-shell: ## Abre una shell en el contenedor backend
	$(COMPOSE) run --rm backend bash

test: test-backend test-frontend ## Ejecuta todos los tests

test-backend: ## Tests del backend (pytest)
	$(COMPOSE) run --rm backend pytest

test-frontend: ## Tests del frontend (vitest)
	$(COMPOSE) run --rm frontend npm run test

lint: ## Lint de backend y frontend
	$(COMPOSE) run --rm backend ruff check .
	$(COMPOSE) run --rm frontend npm run lint

format: ## Formatea backend y frontend
	$(COMPOSE) run --rm backend ruff format .
	$(COMPOSE) run --rm frontend npm run format

check: ## Comprobaciones de CI en local (lint + typecheck + tests + migraciones)
	$(COMPOSE) run --rm backend sh -c "ruff check . && ruff format --check . && mypy . && python manage.py makemigrations --check --dry-run && pytest"
	$(COMPOSE) run --rm frontend sh -c "npm run lint && npm run typecheck && npm run test"
