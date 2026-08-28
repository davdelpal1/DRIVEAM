# Fuente: <nombre>

> Antes de integrar una fuente hay que revisar sus condiciones. Una fuente **no** se considera
> apta para producción hasta que todas las casillas legales estén verificadas.
> Ver `PROJECT_VISION.md` §14 y `ARCHITECTURE.md` §15.

## Identificación

- **Nombre:** 
- **Web:** 
- **Slug interno:** 
- **`integration_type`:** `API` | `FEED` | `AFFILIATE` | `USER_IMPORT` | `MANUAL` | `SCRAPER`

## Revisión legal

| Aspecto | Estado | Notas |
|---|---|---|
| Términos de uso revisados | ⬜ | fecha + enlace |
| `robots.txt` (si aplica) | ⬜ | |
| Derecho de acceso | ⬜ | |
| Derecho de almacenamiento | ⬜ | |
| Derecho de redistribución | ⬜ | |
| Uso de imágenes | ⬜ | URL externa / thumbnail / no permitido |
| Uso comercial | ⬜ | |
| Atribución requerida | ⬜ | |
| Límite de peticiones | ⬜ | req/min permitidas |
| Existe API / feed / programa de afiliación | ⬜ | |

- **Apta para build personal:** ⬜
- **Apta para build pública:** ⬜
- **Última revisión:** AAAA-MM-DD

## Detalles técnicos

- **Autenticación:** 
- **Rate limit aplicado por nosotros:** 
- **Política de refresco:** cada cuánto se re-consulta un anuncio
- **Campos disponibles:** marca, modelo, versión, año, km, precio contado, precio financiado, …
- **Campos ausentes o poco fiables:** 
- **Limitaciones conocidas:** 

## Mapeo a modelo normalizado

| Campo de la fuente | Campo DRIVEAM | Transformación |
|---|---|---|
| | | |
