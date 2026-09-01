# Fuente: Entrada manual

> No es una fuente externa: son los datos que el propio usuario teclea en la pantalla
> "Nuevo candidato". No hay condiciones de terceros que revisar, pero se documenta igual para
> que el `SourceAdapter` de la FASE 8 la trate como una fuente más.

## Identificación

- **Nombre:** Entrada manual
- **Web:** —
- **Slug interno:** `manual`
- **`integration_type`:** `MANUAL`

## Revisión legal

| Aspecto | Estado | Notas |
|---|---|---|
| Términos de uso revisados | ✅ | No aplica: datos introducidos por el usuario |
| `robots.txt` (si aplica) | ✅ | No aplica |
| Derecho de acceso | ✅ | El usuario introduce lo que ve |
| Derecho de almacenamiento | ✅ | Datos propios del usuario |
| Derecho de redistribución | ✅ | Uso personal; no se republica |
| Uso de imágenes | ✅ | No se guardan imágenes todavía (FASE 4) |
| Uso comercial | ✅ | No aplica |
| Atribución requerida | ✅ | No |
| Límite de peticiones | ✅ | No aplica |
| Existe API / feed / programa de afiliación | ✅ | No aplica |

- **Apta para build personal:** ✅
- **Apta para build pública:** ✅
- **Última revisión:** 2026-09-01

## Detalles técnicos

- **Autenticación:** sesión de Django; cada candidato pertenece a `Listing.owner`.
- **Rate limit aplicado por nosotros:** ninguno (escritura autenticada normal).
- **Política de refresco:** ninguna; los datos solo cambian cuando el usuario los edita.
- **Campos disponibles:** marca, modelo, versión, combustible, potencia (CV), año, kilómetros,
  precio contado, precio financiado, vendedor, garantía (meses), ubicación, URL, notas.
- **Campos ausentes o poco fiables:** cualquiera salvo marca y modelo puede quedar vacío; se
  guarda `null`, nunca `0`.
- **Limitaciones conocidas:** sin deduplicación (FASE 12); un candidato manual crea siempre un
  `Vehicle` nuevo aunque exista uno equivalente.

## Mapeo a modelo normalizado

| Campo del formulario | Campo DRIVEAM | Transformación |
|---|---|---|
| marca / modelo / versión | `Vehicle.make` / `.model` / `.version` | trim |
| combustible | `Vehicle.fuel_type` | valor de `FuelType`; vacío → `desconocido` |
| potencia | `Vehicle.power_cv` | entero o `null` |
| año | `Vehicle.first_registration_year` | entero (1900–2100) o `null` |
| kilómetros | `Listing.mileage_km` | entero o `null` |
| precio contado / financiado | `Listing.price_cash` / `.price_financed` | `Decimal` (cadena) o `null` |
| vendedor | `Seller.name` (bajo la fuente `manual`) | crea/reutiliza `Seller` por nombre |
| garantía | `Listing.warranty_months` | entero o `null` |
| ubicación | `Listing.city` | trim |
| URL | `Listing.url` | opcional |
| notas | `UserVehicleNote.text` (del usuario) | trim; vacío elimina la nota |
