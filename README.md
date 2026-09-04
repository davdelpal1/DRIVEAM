# DRIVEAM

DRIVEAM es una plataforma para **buscar, guardar, normalizar, comparar y evaluar vehículos de ocasión procedentes de distintas fuentes** con el objetivo de ayudar al usuario a tomar una decisión de compra mejor informada.

El proyecto nace como una herramienta de uso personal para comparar vehículos durante un proceso real de compra, pero se diseña desde el primer commit para poder evolucionar a un producto público web y, posteriormente, a aplicaciones para Android e iOS.

---

## 1. Problema que queremos resolver

Buscar un coche de segunda mano obliga actualmente a:

- revisar múltiples portales;
- repetir filtros en cada web;
- guardar enlaces en notas, WhatsApp o favoritos del navegador;
- comparar manualmente precio, año, kilómetros, motor y equipamiento;
- interpretar condiciones de financiación poco claras;
- comprobar si un vehículo está caro o barato respecto al mercado;
- recordar cambios de precio;
- detectar anuncios repetidos;
- valorar si un coche realmente encaja con las prioridades del comprador.

DRIVEAM centraliza este proceso en una única aplicación.

---

## 2. Propuesta de valor

La plataforma permitirá:

1. **Importar vehículos** desde diferentes fuentes.
2. Guardarlos en una **base de datos común y normalizada**.
3. Crear una lista personal de candidatos.
4. Comparar varios vehículos lado a lado.
5. Registrar precio, kilómetros, año, motor, consumo, financiación, garantía y otros atributos.
6. Mantener un historial de cambios del anuncio.
7. Calcular un **Car Score** configurable.
8. Analizar el **coste real de la financiación**.
9. Detectar posibles anuncios duplicados.
10. Alertar sobre bajadas de precio o nuevos vehículos relevantes.
11. Incorporar, en fases posteriores, un asistente de IA que explique ventajas, inconvenientes y diferencias entre candidatos.

---

## 3. Filosofía de desarrollo

El proyecto seguirá estas reglas desde el principio:

### MVP primero

No construir funcionalidades porque “algún día podrían hacer falta”.

Cada fase debe producir una mejora utilizable.

### Arquitectura preparada para crecer, pero sin sobreingeniería

Se separarán correctamente:

- frontend;
- backend;
- persistencia;
- ingesta de datos;
- proveedores externos;
- lógica de scoring.

Pero no se introducirán microservicios, Kubernetes ni infraestructura compleja mientras no exista una necesidad real.

### La fuente de datos es sustituible

La aplicación **no debe depender de un scraper concreto**.

Toda fuente deberá implementar una interfaz común para que pueda ser sustituida por:

- API;
- feed;
- integración comercial;
- importación mediante URL;
- entrada manual;
- scraper autorizado.

### Una única fuente de verdad

Los datos normalizados vivirán en una base de datos común.

Los anuncios originales se conservarán como entidades independientes de los vehículos normalizados.

### Calidad desde el primer commit

- tipado;
- linting;
- formateo;
- tests;
- migraciones;
- documentación;
- control de versiones;
- CI;
- gestión segura de secretos.

### Desarrollo orientado a producto

El primer usuario será el propio creador del proyecto.

Las decisiones de producto se validarán utilizándolo durante un proceso real de búsqueda de vehículo.

---

## 4. Alcance del MVP

El MVP inicial debe permitir:

- [x] autenticación;
- [x] crear un perfil de preferencias;
- [x] añadir un coche manualmente;
- [x] importar un vehículo mediante URL cuando exista un adaptador compatible;
- [x] editar los datos importados;
- [x] guardar vehículos como favoritos;
- [x] añadir notas personales;
- [x] ver el detalle de un vehículo;
- [x] comparar entre 2 y 5 candidatos;
- [x] registrar precio al contado;
- [x] registrar información de financiación;
- [x] calcular el coste total aproximado de una financiación;
- [x] mantener la URL original del anuncio;
- [x] identificar la fuente y el vendedor;
- [x] mostrar un score inicial basado en reglas sencillas.

El MVP personal (FASES 0–8 de [`PLAN.md`](./PLAN.md)) está completo.

### Fuera del MVP

No se implementará inicialmente:

- crawling masivo;
- scraping de decenas de portales;
- Machine Learning;
- recomendaciones generativas complejas;
- marketplace propio;
- mensajería con concesionarios;
- pagos;
- aplicaciones móviles nativas;
- infraestructura distribuida;
- sistema comercial para concesionarios.

---

## 5. Stack inicial

### Frontend web

- Next.js 16 (App Router) · React 19
- TypeScript (modo strict)
- Tailwind CSS v4
- componentes UI accesibles y reutilizables
- ESLint · Prettier · Vitest · Playwright (E2E)

### Backend

- Python 3.13
- Django 5.2 LTS
- Django REST Framework · drf-spectacular (OpenAPI)
- Ruff (lint + formato) · mypy · pytest

### Base de datos

- PostgreSQL 17

### Procesamiento asíncrono

No será obligatorio para la primera iteración.

Cuando sea necesario:

- Redis
- Celery

### Ingesta

Según cada fuente:

- HTTP + parser HTML
- BeautifulSoup / lxml
- Playwright
- Scrapy en fases posteriores
- API o feeds cuando estén disponibles

### Infraestructura

- Docker
- Docker Compose para desarrollo
- GitHub
- GitHub Actions
- despliegue desacoplado de frontend, backend y base de datos

---

## 6. Estructura inicial del repositorio

```text
driveam/
├── frontend/            Next.js 16 + Tailwind
├── backend/             Django 5.2 + DRF (config/ + apps/)
├── docs/
│   ├── decisions/       ADRs (0001-0006)
│   ├── api/
│   └── data-sources/
├── scripts/
├── .github/workflows/   ci.yml
├── docker-compose.yml
├── Makefile
├── .env.example
├── README.md · PROJECT_VISION.md · ARCHITECTURE.md · PLAN.md · CHANGELOG.md
└── CLAUDE.md            guía para agentes de IA
```

---

## Puesta en marcha local

Requisitos: **Docker** (con Docker Compose). No hace falta Python ni Node en el host.

```bash
cp .env.example .env
docker compose up --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Frontend — catálogo | http://localhost:3000/catalogo |
| Frontend — registro / login / preferencias | http://localhost:3000/registro · `/entrar` · `/perfil` |
| API — health | http://localhost:8000/api/v1/health/ |
| API — autenticación | http://localhost:8000/api/v1/auth/login/ · `/register/` · `/me/` |
| API — preferencias | http://localhost:8000/api/v1/preferences/ |
| API — vehículos y anuncios | http://localhost:8000/api/v1/vehicles/ · `/listings/` |
| API — documentación (Swagger UI) | http://localhost:8000/api/v1/schema/swagger-ui/ |
| Admin de Django | http://localhost:8000/admin/ |

La home muestra en verde el estado de los tres servicios cuando todo está conectado.

Si el puerto 3000 u 8000 está ocupado, ajusta `FRONTEND_PORT` / `BACKEND_PORT` en `.env`.

```bash
docker compose run --rm backend python manage.py createsuperuser   # usuario admin (pide email)
docker compose run --rm backend python manage.py migrate           # migraciones
```

## Recorrido de demostración

Para ver el MVP funcionando de principio a fin sin tener que introducir nada a mano.

### 1. Sembrar datos de ejemplo

```bash
docker compose exec backend python manage.py seed_demo
```

Crea (y recrea en cada ejecución) el usuario **`demo@driveam.test` / `driveam-demo-2026`** con:

- preferencias de compra (presupuesto objetivo 15.000 € / máximo 18.000 €, año mínimo 2018,
  máximo 120.000 km, prioridades del Car Score);
- **5 candidatos** realistas (VW Golf, SEAT León, Toyota Corolla, Kia Ceed, Renault Mégane)
  con Car Score calculado, consumo, estados de seguimiento, favoritos, notas y —en dos de
  ellos— una oferta de financiación. El Golf está marcado como **importado por URL** (fuente
  `datos-estructurados`).

Solo para desarrollo; no usar en producción.

### 2. Recorrido guiado en el navegador

Abre una ventana real de Chrome (o Edge), inicia sesión con la cuenta de demo y recorre solo
las 7 etapas del MVP con un rótulo que va narrando cada paso:

```bash
cd frontend
npm run demo                  # Chrome
BROWSER=msedge npm run demo    # Microsoft Edge
SPEED=1000 npm run demo        # ms entre acciones (por defecto 700; menor = más rápido)
```

Requiere el stack levantado (`docker compose up`) y Node en el host (script:
`frontend/scripts/demo-navegador.mjs`).

| Etapa | Qué muestra |
|---|---|
| 1 · Inicio de sesión | Login con `demo@driveam.test`. |
| 2 · Preferencias | `/perfil`: criterios de compra y pesos del Car Score; sube el peso del *Precio* y guarda. |
| 3 · Mis coches | Dashboard: cambia el estado de seguimiento de un candidato y prueba un filtro. |
| 4 · Car Score | Desglose del Golf factor a factor (precio, km, antigüedad, **consumo**, garantía) con el motivo de cada nota. |
| 5 · Comparador | Selecciona 3 coches y abre la tabla comparativa (mejor valor resaltado por criterio). |
| 6 · Financiación | Cambia cuota y nº de cuotas del León y ve el coste total recalcularse en vivo. |
| 7 · Importar por URL | Pega un enlace, revisa los datos leídos de la página y guarda el candidato. |

> La descarga de la web externa de la etapa 7 está **simulada** dentro del script (respuesta
> fija) para que el recorrido sea siempre idéntico y no dependa de internet; el guardado sí es
> real. El script borra el coche importado de la ejecución anterior antes de empezar.

## Tests y calidad

```bash
# Backend
docker compose run --rm backend ruff check .
docker compose run --rm backend ruff format .
docker compose run --rm backend mypy .
docker compose run --rm backend pytest

# Frontend
docker compose run --rm frontend npm run lint
docker compose run --rm frontend npm run typecheck
docker compose run --rm frontend npm run test

# E2E (Playwright): con el stack levantado y Node en el host
cd frontend && npm run test:e2e
```

Con `make` instalado: `make up`, `make test`, `make test-e2e`, `make lint`, `make check`
(ver `make help`).
La CI de GitHub Actions ejecuta estas mismas comprobaciones en cada Pull Request.

---

## 7. Modelo conceptual básico

Se diferenciarán dos conceptos:

### Vehicle

Representa el coche normalizado.

Ejemplo:

- Seat León
- 1.6 TDI
- 115 CV
- 2020

### Listing

Representa un anuncio específico publicado en una fuente.

Un mismo `Vehicle` puede aparecer en varios `Listing`.

```text
Vehicle
└── Seat León 1.6 TDI 115 CV 2020
    ├── Listing A · Portal 1 · 10.500 €
    ├── Listing B · Portal 2 · 10.900 €
    └── Listing C · concesionario · 10.250 €
```

Esta separación será fundamental para:

- detectar duplicados;
- comparar precios entre fuentes;
- mantener históricos;
- cambiar integraciones sin romper el dominio.

---

## 8. Seguridad y cumplimiento

Antes de integrar una fuente externa habrá que revisar:

- términos de uso;
- robots.txt cuando proceda;
- restricciones técnicas;
- derechos sobre datos e imágenes;
- posibilidad de reutilización comercial;
- frecuencia permitida;
- existencia de API, feed o programa de afiliación.

**Nunca se asumirá que una web puede scrapearse o republicarse comercialmente solo porque sea técnicamente posible.**

Los datos personales deberán tratarse conforme a la normativa aplicable.

---

## 9. Estrategia de lanzamiento

### Etapa 1 — Uso personal

Validar:

- importación;
- favoritos;
- comparador;
- financiación;
- scoring;
- utilidad real.

### Etapa 2 — Beta privada

Añadir:

- usuarios;
- alertas;
- histórico;
- varias fuentes;
- métricas.

### Etapa 3 — Web pública

Añadir:

- SEO;
- páginas públicas;
- búsqueda;
- filtros avanzados;
- consentimiento y privacidad;
- observabilidad;
- escalado.

### Etapa 4 — Mobile

- React Native + Expo;
- Android;
- iOS;
- compartir un anuncio directamente a la aplicación;
- notificaciones push.

---

## 10. Estado

**Estado actual:** FASE 8 completada — importación por URL (patrón Source Adapter + primer
adaptador de datos estructurados, endpoint con prevención de SSRF) y el dato de consumo en el
Car Score. Con ella se cierra el MVP personal (FASES 0–8): autenticación, preferencias, alta
manual y por URL, favoritos, notas, dashboard, comparador, calculadora de financiación y Car
Score V1. Ver `CHANGELOG.md` y ADRs `docs/decisions/0001`–`0013`.

**Siguiente:** parar y evaluar el producto con una búsqueda real de coche antes de continuar
la hoja de ruta (FASE 9 — historial de anuncios — si se sigue). Ver
[`PLAN.md`](./PLAN.md).

Siguiente documento: [`PLAN.md`](./PLAN.md)

Arquitectura: [`ARCHITECTURE.md`](./ARCHITECTURE.md)

Visión completa: [`PROJECT_VISION.md`](./PROJECT_VISION.md)
