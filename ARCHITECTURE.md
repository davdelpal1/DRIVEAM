# ARCHITECTURE.md

# Arquitectura — DRIVEAM

> Documento vivo. Las decisiones importantes deberán registrarse mediante ADRs en `docs/decisions/`.

---

## 1. Objetivos arquitectónicos

La arquitectura debe ser:

- sencilla de ejecutar localmente;
- fácil de entender;
- testeable;
- desacoplada de fuentes externas;
- segura;
- observable;
- escalable progresivamente;
- compatible con web y futuras apps móviles.

No buscamos una arquitectura “enterprise” desde el primer día.

Buscamos evitar decisiones que nos obliguen a reescribir el producto cuando crezca.

---

# 2. Arquitectura lógica

```text
┌───────────────────────────────┐
│          CLIENTES             │
│                               │
│ Next.js Web                   │
│ React Native / Expo (futuro)  │
└──────────────┬────────────────┘
               │
               │ HTTPS / JSON
               ▼
┌───────────────────────────────┐
│        DJANGO REST API        │
│                               │
│ Auth                          │
│ Vehicles                      │
│ Listings                      │
│ Favorites                     │
│ Comparison                    │
│ Finance                       │
│ Scoring                       │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│          POSTGRESQL           │
└───────────────────────────────┘

        Procesamiento asíncrono
                 │
                 ▼
┌───────────────────────────────┐
│        Celery + Redis         │
│           (futuro)            │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│       SOURCE ADAPTERS         │
│                               │
│ API                           │
│ Feed                          │
│ User Import                   │
│ Manual                        │
│ Scraper                       │
└───────────────────────────────┘
```

---

# 3. Monorepo

Se utilizará inicialmente un monorepo.

```text
/
├── frontend/
│   ├── src/
│   ├── public/
│   └── tests/
│
├── backend/
│   ├── config/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── vehicles/
│   │   ├── listings/
│   │   ├── sources/
│   │   ├── favorites/
│   │   ├── comparisons/
│   │   ├── finance/
│   │   └── scoring/
│   └── tests/
│
├── docs/
│   ├── decisions/
│   ├── api/
│   └── data-sources/
│
├── scripts/
├── .github/workflows/
├── docker-compose.yml
├── .env.example
├── README.md
├── PROJECT_VISION.md
├── ARCHITECTURE.md
├── PLAN.md
└── CHANGELOG.md
```

---

# 4. Frontend

## Tecnología

- Next.js
- TypeScript
- Tailwind CSS

### Principios

- Server Components cuando aporten valor.
- Client Components solo donde sea necesario.
- formularios accesibles;
- responsive mobile-first;
- componentes pequeños;
- estados de carga;
- estados vacíos;
- manejo explícito de errores.

### Organización aproximada

```text
frontend/src/
├── app/
├── components/
├── features/
├── lib/
├── services/
├── hooks/
├── types/
└── tests/
```

Evitar:

```text
components/
└── 150 componentes sin dominio
```

Preferir agrupación por feature.

---

# 5. Backend

## Tecnología

- Django
- Django REST Framework

### Organización por dominio

```text
apps/
├── accounts/
├── vehicles/
├── listings/
├── sources/
├── favorites/
├── comparisons/
├── finance/
└── scoring/
```

### Principio

Las views no deben contener toda la lógica.

Separar cuando sea necesario:

```text
View
 ↓
Service / Use Case
 ↓
Domain / Model
 ↓
Repository / ORM
```

No crear capas artificiales si una operación es trivial.

---

# 6. Modelo de datos

## Source

Representa el proveedor de datos.

Campos orientativos:

```text
id
name
slug
website
integration_type
enabled
commercial_use_allowed
images_allowed
refresh_policy
terms_reviewed_at
notes
created_at
updated_at
```

---

## Seller

```text
id
source
external_id
name
type
website
phone
location
rating
created_at
updated_at
```

Tipos:

```text
PRIVATE
DEALER
MARKETPLACE
UNKNOWN
```

---

## Vehicle

Representa el vehículo normalizado.

```text
id
make
model
generation
version
body_type
fuel_type
transmission
engine_displacement
power_kw
power_cv
doors
seats
first_registration_year
emissions_label
created_at
updated_at
```

No todos los datos estarán disponibles siempre.

---

## Listing

Representa un anuncio.

```text
id
source
external_id
vehicle
seller
url

title
description

price_cash
price_financed

mileage_km
registration_date

province
city

warranty_months

status
first_seen_at
last_seen_at
published_at

raw_data
created_at
updated_at
```

`raw_data` permitirá conservar datos originales no normalizados.

No debe sustituir a los campos estructurados.

---

## ListingSnapshot

```text
id
listing
captured_at
price_cash
price_financed
mileage_km
status
raw_data
```

Servirá para histórico.

---

## FinanceOffer

```text
id
listing
deposit
amount_financed
monthly_payment
number_of_payments
final_payment
opening_fee
tin
tae
mandatory_products_cost
total_cost
source_text
created_at
updated_at
```

---

## Favorite

```text
id
user
listing
created_at
```

---

## UserVehicleNote

```text
id
user
listing
text
created_at
updated_at
```

---

## UserPreference

Ejemplo:

```text
budget_target
budget_max
max_mileage
min_year
fuel_types
body_types

weight_price
weight_mileage
weight_age
weight_reliability
weight_consumption
weight_financing
```

---

## Score

```text
id
listing
user
score
version
breakdown
calculated_at
```

`breakdown` debe permitir explicar el resultado.

---

# 7. Source Adapter Pattern

Pieza arquitectónica fundamental.

```python
class SourceAdapter:
    def can_handle(self, url: str) -> bool:
        ...

    def fetch_listing(self, url: str):
        ...

    def normalize(self, raw_data):
        ...
```

Implementaciones futuras:

```text
ManualAdapter
UrlImportAdapter
ApiAdapter
FeedAdapter
ScraperAdapter
```

Ejemplo:

```text
sources/
├── base.py
├── registry.py
├── manual/
├── source_a/
├── source_b/
└── source_c/
```

El resto de la aplicación no debe saber cómo se obtuvieron los datos.

---

# 8. Pipeline de ingesta

```text
URL / API / Feed
       ↓
SourceAdapter
       ↓
Raw Listing
       ↓
Validator
       ↓
Normalizer
       ↓
Deduplicator
       ↓
Vehicle + Listing
       ↓
Snapshot
       ↓
Scoring
```

Todos los pasos deben ser observables y testeables.

---

# 9. Datos originales

Siempre que sea razonable, conservar:

- valor original;
- valor normalizado;
- timestamp;
- fuente.

Ejemplo:

```json
{
  "raw": "87.320 kms",
  "normalized": 87320
}
```

Esto facilita:

- debugging;
- cambios de parser;
- auditoría;
- mejoras de normalización.

---

# 10. Deduplicación

No implementar deduplicación compleja en el MVP.

## Fase inicial

Coincidencia manual o reglas simples.

## Futuro

`duplicate_confidence` basado en:

- VIN;
- matrícula cuando proceda;
- seller;
- modelo;
- versión;
- año;
- km;
- ubicación;
- precio;
- imágenes.

Nunca eliminar automáticamente anuncios.

Se relacionarán.

---

# 11. Scoring

El scoring será un módulo independiente.

```text
scoring/
├── engine.py
├── rules/
├── versions/
└── tests/
```

Entrada:

```text
Listing
Vehicle
UserPreference
MarketContext
```

Salida:

```json
{
  "score": 87,
  "version": "v1",
  "breakdown": {
    "price": 92,
    "mileage": 88,
    "age": 83
  }
}
```

Las fórmulas deben estar versionadas.

---

# 12. API

Base:

```text
/api/v1/
```

Ejemplos:

```text
GET    /api/v1/listings/
POST   /api/v1/listings/import/
GET    /api/v1/listings/{id}/
PATCH  /api/v1/listings/{id}/

POST   /api/v1/favorites/
DELETE /api/v1/favorites/{id}/

POST   /api/v1/comparisons/
POST   /api/v1/finance/calculate/
GET    /api/v1/preferences/
PATCH  /api/v1/preferences/
```

### Reglas

- versionar API;
- paginación;
- filtros;
- errores consistentes;
- validación estricta;
- OpenAPI.

---

# 13. Autenticación

Primera fase:

- email + contraseña;
- sesiones o tokens seguros según arquitectura final.

Futuro:

- Google;
- Apple.

No construir OAuth hasta necesitarlo.

---

# 14. Seguridad

Obligatorio:

- secretos fuera del repositorio;
- `.env.example` sin credenciales;
- HTTPS en producción;
- CORS restrictivo;
- protección CSRF según estrategia auth;
- validación de URLs importadas;
- protección SSRF;
- rate limiting en endpoints sensibles;
- sanitización de HTML;
- dependencias actualizadas;
- logs sin información sensible.

Especial atención al endpoint:

```text
POST /listings/import/
```

No debe permitir al servidor solicitar URLs arbitrarias internas.

---

# 15. Scraping y fuentes externas

Cada integración tendrá documentación:

```text
docs/data-sources/<source>.md
```

Debe incluir:

```text
Integration type
Terms reviewed
Commercial use
Images
Rate limit
Authentication
Data fields
Known limitations
Last review date
```

El código de extracción nunca debe mezclarse con vistas o modelos del dominio.

---

# 16. Procesamiento asíncrono

No introducir Celery hasta que exista una tarea que lo justifique.

Casos candidatos:

- refrescar anuncios;
- recalcular scores;
- comprobar alertas;
- importar lotes;
- procesamiento de imágenes;
- deduplicación.

Cuando se añada:

```text
Django
   ↓
Redis
   ↓
Celery Worker
   ↓
Celery Beat
```

---

# 17. Caché

No introducir cache prematuramente.

Primero medir.

Candidatos futuros:

- búsquedas públicas;
- páginas SEO;
- datos de mercado;
- estadísticas.

---

# 18. Imágenes

No copiar imágenes de terceros automáticamente sin validar derechos.

Inicialmente se priorizará:

- URL externa;
- thumbnail permitido;
- imagen cargada manualmente;
- placeholders.

En producción, la política dependerá de cada fuente.

---

# 19. Testing

Pirámide aproximada:

### Unit tests

- normalizadores;
- scoring;
- financiación;
- parsers;
- deduplicación.

### Integration tests

- API;
- DB;
- adapters.

### E2E

Flujos críticos:

```text
Login
→ importar coche
→ guardar
→ comparar
```

Herramientas posibles:

Frontend:

- Vitest
- Testing Library
- Playwright

Backend:

- pytest
- pytest-django

---

# 20. Calidad

Frontend:

```text
ESLint
Prettier
TypeScript strict
```

Backend:

```text
Ruff
Black o formato equivalente
mypy progresivo
pytest
```

No exigir cobertura arbitraria del 100 %.

Priorizar código crítico.

---

# 21. Git

Ramas:

```text
main
feature/*
fix/*
```

`main` debe estar desplegable.

Commits:

- claros;
- pequeños;
- relacionados con una unidad lógica.

Convención recomendada:

```text
feat:
fix:
docs:
refactor:
test:
chore:
```

---

# 22. CI

GitHub Actions desde fase temprana.

Pull Request:

```text
frontend lint
frontend typecheck
frontend tests

backend lint
backend tests

migration check
```

`main`:

además:

```text
build
container build
deploy
```

---

# 23. Docker

Desarrollo inicial:

```text
frontend
backend
postgres
```

Posteriormente:

```text
redis
worker
beat
```

El proyecto debe poder arrancar con:

```bash
docker compose up
```

salvo configuración inicial documentada.

---

# 24. Entornos

```text
local
test
staging
production
```

No mezclar staging con producción.

Configuración mediante variables de entorno.

---

# 25. Observabilidad

Desde producción:

- logs estructurados;
- error tracking;
- health checks.

Futuro:

- métricas;
- tracing.

Nunca introducir una plataforma compleja antes de necesitarla.

---

# 26. ADR

Decisiones relevantes:

```text
docs/decisions/
├── 0001-monorepo.md
├── 0002-django-nextjs.md
├── 0003-postgresql.md
└── 0004-source-adapter.md
```

Formato:

```text
Context
Decision
Alternatives
Consequences
```

---

# 27. Principios que no deben romperse

1. `Vehicle` y `Listing` son conceptos distintos.
2. Ninguna fuente externa controla el dominio.
3. El frontend no accede directamente a scrapers.
4. Los cálculos financieros son reproducibles.
5. Los scores son explicables y versionados.
6. Las integraciones externas tienen política propia.
7. El MVP debe poder ejecutarse sin Celery.
8. `main` debe mantenerse desplegable.
9. Los secretos nunca se versionan.
10. La complejidad se introduce cuando existe una necesidad medida.
