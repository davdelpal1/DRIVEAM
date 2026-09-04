# Fuente: Datos estructurados (schema.org / Open Graph)

> No es un portal concreto. Es un adaptador **genérico** que lee los datos estructurados que
> una página cualquiera publica para buscadores: JSON-LD de schema.org
> (`Vehicle` / `Car` / `Product`) y, como apoyo, etiquetas Open Graph (`og:*`,
> `product:price:*`). El usuario pega el enlace de un anuncio que ya está viendo; DRIVEAM lo
> descarga una vez, extrae esos metadatos y los muestra para revisión antes de guardar.

## Identificación

- **Nombre:** Datos estructurados (schema.org)
- **Web:** —
- **Slug interno:** `datos-estructurados`
- **`integration_type`:** `USER_IMPORT`

## Revisión legal

| Aspecto | Estado | Notas |
|---|---|---|
| Términos de uso revisados | ✅ | No hay un tercero único; ver criterio abajo |
| `robots.txt` | ⚠️ | Se hace **una** petición puntual iniciada por el usuario sobre una URL que él aporta; no hay rastreo, indexación ni acceso masivo |
| Derecho de acceso | ✅ | El usuario ya tiene acceso a esa página y aporta la URL |
| Derecho de almacenamiento | ✅ | Uso personal; se guardan los campos normalizados del candidato del propio usuario |
| Derecho de redistribución | ✅ | No se republica nada; build personal |
| Uso de imágenes | ✅ | No se descargan ni se guardan imágenes |
| Uso comercial | ❌ | `commercial_use_allowed = False`; la versión pública usará fuentes con términos propios (FASE 13) |
| Atribución requerida | ✅ | Se conserva la URL de origen en `Listing.url` y `Listing.raw_data` |
| Límite de peticiones | ✅ | Throttle propio `listings-import` (`30/hour`, configurable); 1 petición por importación, con tiempo de espera y tamaño máximo |
| Existe API / feed / afiliación | — | Depende de cada web; este adaptador no usa ninguna |

**Criterio:** los datos estructurados (JSON-LD / Open Graph) los publica la propia web *para
que los consuman terceros* (Google, redes sociales). Leerlos de forma puntual para uso
personal, sin rastreo ni republicación, es el caso de uso más conservador para la fase de
prueba de la FASE 8. Integrar un portal concreto exige estudiar sus términos uno a uno y se
pospone a la FASE 13.

- **Apta para build personal:** ✅
- **Apta para build pública:** ❌ (revisar por fuente en la FASE 13)
- **Última revisión:** 2026-09-03

## Detalles técnicos

- **Adaptador:** `backend/apps/sources/adapters/structured_data.py` (`StructuredDataAdapter`).
- **`can_handle`:** cualquier URL `http(s)` (es la fuente por defecto del registry).
- **Descarga:** `fetch.py` — `GET` con `User-Agent` propio, tiempo de espera 10 s, máximo
  3 MB, solo `Content-Type` de tipo HTML, redirecciones revalidadas contra SSRF.
- **Prevención de SSRF:** `ssrf.py` — solo `http(s)`, sin credenciales, puertos
  `80/443/8000`; el host debe resolver **solo** a IPs públicas. Ver ADR 0013 §3.
- **Autenticación:** ninguna hacia la fuente; el endpoint de DRIVEAM requiere sesión.
- **Política de refresco:** ninguna (V1); el histórico llega en la FASE 9.
- **Campos que se intentan extraer:** marca, modelo, versión, año
  (`dateVehicleFirstRegistered` / `vehicleModelDate` / …), combustible, potencia
  (`enginePower`, convierte kW→CV), **consumo medio** (`fuelConsumption`), kilómetros
  (`mileageFromOdometer`), precio (`offers.price`, moneda), vendedor y ubicación, título y
  descripción.
- **Campos ausentes o poco fiables:** casi todos son opcionales. Si falta marca+modelo, la
  importación falla con `unparseable_listing` y el usuario usa el alta manual. Los avisos
  (`warnings`) señalan conversiones y deducciones (p. ej. modelo deducido del título, millas
  → km, moneda distinta de EUR).
- **Limitaciones conocidas:**
  - muchas webs no publican JSON-LD de vehículo; solo se saca lo que haya en Open Graph;
  - no se hace deduplicación (FASE 12): cada importación crea un `Vehicle` nuevo;
  - DNS rebinding: ventana pequeña entre validación y descarga (ADR 0013).

## Mapeo a modelo normalizado

| Dato estructurado | Campo DRIVEAM | Transformación |
|---|---|---|
| `brand.name` / `manufacturer` / `og:brand` | `Vehicle.make` | trim |
| `model` (o deducido del título) | `Vehicle.model` | trim; si se deduce, aviso |
| `vehicleConfiguration` / `trim` | `Vehicle.version` | trim |
| `fuelType` / `og:fuel_type` | `Vehicle.fuel_type` | mapa a `FuelType`; desconocido → `desconocido` |
| `enginePower` (`QuantitativeValue`) | `Vehicle.power_cv` | kW→CV si la unidad es kW; si no, se asume CV |
| `dateVehicleFirstRegistered` / `vehicleModelDate` / … | `Vehicle.first_registration_year` | año de 4 cifras (1900–2100) o `null` |
| `fuelConsumption` (`QuantitativeValue`) | `Vehicle.fuel_consumption` | L/100 km, 1 decimal; descarta <1 o >30 |
| `mileageFromOdometer` | `Listing.mileage_km` | entero ≥ 0; millas → km con aviso |
| `offers.price` (+ `priceCurrency`) / `product:price:amount` | `Listing.price_cash` | `Decimal` es-ES; moneda ≠ EUR → aviso |
| `offers.seller.name` | `Seller.name` (fuente `datos-estructurados`) | crea/reutiliza por nombre |
| `offers.seller.address.addressLocality` / `location` | `Listing.city` | trim |
| URL aportada por el usuario | `Listing.url` + `Listing.raw_data.import_url` | se conserva siempre |
