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

## Endpoints actuales

- `GET /api/v1/health/` — comprobación de vida del servicio y de la conexión a base de datos.
