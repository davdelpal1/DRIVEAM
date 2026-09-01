# API

La API de DRIVEAM está versionada bajo el prefijo `/api/v1/`.

## Esquema OpenAPI

Generado automáticamente con [`drf-spectacular`](https://drf-spectacular.readthedocs.io/):

| Recurso | URL (desarrollo) |
|---|---|
| Esquema (YAML) | http://localhost:8000/api/v1/schema/ |
| Swagger UI | http://localhost:8000/api/v1/schema/swagger-ui/ |
| ReDoc | http://localhost:8000/api/v1/schema/redoc/ |

El esquema es la fuente de verdad del contrato; no se mantiene documentación de endpoints a mano.

## Convenciones

- Versionado por URL (`/api/v1/`, `/api/v2/`…).
- Paginación por número de página (`?page=`), tamaño por defecto 20.
- Errores con forma consistente (formato de DRF).
- Validación estricta de entrada; los campos monetarios se transportan como cadenas decimales.
- Filtros con `django-filter` (`?campo=valor`), búsqueda de texto (`?search=`) y ordenación
  (`?ordering=campo` / `?ordering=-campo`).
- Permisos (FASE 1, provisional hasta la FASE 2): lectura pública; para crear/editar hace falta
  una sesión autenticada (admin de Django o API navegable de DRF con un superusuario).

## Endpoints actuales

- `GET /api/v1/health/` — comprobación de vida del servicio y de la conexión a base de datos.
- `GET·POST /api/v1/sources/` · `GET·PUT·PATCH·DELETE /api/v1/sources/{id}/`
  — fuentes de datos. Filtros: `integration_type`, `enabled`. Búsqueda: `name`, `slug`.
- `GET·POST /api/v1/sellers/` · `.../{id}/` — vendedores. Filtros: `source`, `type`.
- `GET·POST /api/v1/vehicles/` · `.../{id}/` — vehículos normalizados. Filtros: `make`, `model`
  (`exact`/`icontains`), `fuel_type`, `transmission`, `first_registration_year`
  (`exact`/`gte`/`lte`). Ordenación: `make`, `first_registration_year`, `created_at`.
- `GET·POST /api/v1/listings/` · `.../{id}/` — anuncios. Se envían `vehicle`, `source` y
  `seller` (opcional) por id; la respuesta incluye `vehicle_detail`, `source_detail`,
  `seller_detail` y `finance_offers` anidados. Filtros: `price_cash_min`, `price_cash_max`,
  `mileage_max`, `year_min`, `fuel_type`, `status`, `source`, `province`. Búsqueda: `title`,
  `description`. Ordenación: `price_cash`, `mileage_km`, `registration_date`, `created_at`.

> Los endpoints de favoritos, notas, preferencias, score y capturas de anuncio llegan en sus
> fases (2, 3, 7 y 9); ver `docs/decisions/0006-modelo-de-dominio.md`.
