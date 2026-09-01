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
- Autenticación por **sesión de Django** (cookie `sessionid`, ver ADR 0007). El cliente pide
  `GET /auth/csrf/` y envía la cabecera `X-CSRFToken` en las peticiones de escritura.
- Permisos del catálogo: lectura pública. `Source` (configuración del sistema) solo la escribe
  el personal (`is_staff`); `sellers`/`vehicles`/`listings` los puede crear/editar cualquier
  usuario autenticado.

## Endpoints actuales

- `GET /api/v1/health/` — comprobación de vida del servicio y de la conexión a base de datos.
- **Autenticación** (`apps/accounts`, FASE 2):
  - `GET /api/v1/auth/csrf/` — fija la cookie `csrftoken`.
  - `POST /api/v1/auth/register/` — `{email, password}`; crea la cuenta e inicia sesión
    (`201`). `403` si el registro está deshabilitado (`DJANGO_REGISTRATION_ENABLED`). Límite:
    `5/hora`.
  - `POST /api/v1/auth/login/` — `{email, password}`; error genérico (`400`) si fallan. Límite:
    `10/min`.
  - `POST /api/v1/auth/logout/` — cierra la sesión (`204`).
  - `GET /api/v1/auth/me/` — usuario autenticado, o `401`.
  - `GET·PUT·PATCH /api/v1/preferences/` — preferencias de compra del usuario (singleton, se
    autocrean): presupuesto objetivo/máximo, año mínimo, kilometraje máximo, `fuel_types`,
    `body_types` y los pesos `weight_*` (0–100) del Car Score.
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

> Los endpoints de favoritos y notas (FASE 3), score (FASE 7) y capturas de anuncio (FASE 9)
> llegan en sus fases; ver `docs/decisions/0006-modelo-de-dominio.md`.
