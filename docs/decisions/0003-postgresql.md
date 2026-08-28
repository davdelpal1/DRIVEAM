# 0003 — PostgreSQL como única base de datos

- **Estado:** aceptada
- **Fecha:** 2026-08-28

## Contexto

El modelo de datos de DRIVEAM combina datos relacionales (Vehicle, Listing, Seller, Score) con
campos semiestructurados (`Listing.raw_data`, `Score.breakdown`, `FinanceOffer.source_text`).
Más adelante se necesitará búsqueda por texto, agregados de mercado (medianas, percentiles) e
histórico de precios. Es una única fuente de verdad (`ARCHITECTURE.md` §27.2).

## Decisión

PostgreSQL 17 como único motor, en todos los entornos (local, test, staging, producción).
En desarrollo corre como servicio de Docker Compose. El backend se conecta vía `DATABASE_URL`.
Se usa `JSONField` de PostgreSQL para los campos semiestructurados.

## Alternativas consideradas

- **SQLite en desarrollo/test** — divergencia con producción en tipos, JSON, constraints y
  búsqueda; los bugs aparecerían tarde. La paridad de entornos compensa el arranque de un contenedor.
- **MySQL/MariaDB** — menor soporte de JSON, sin tipos de rango ni `pg_trgm`/full-text tan maduros.
- **MongoDB u otro NoSQL** — el dominio es fuertemente relacional; perderíamos integridad
  referencial entre Vehicle y Listing, que es central en el producto.

## Consecuencias

- Ejecutar los tests requiere una instancia de PostgreSQL (contenedor en local, service en CI).
- Podemos apoyarnos en características específicas de PostgreSQL sin capa de abstracción extra.
- Las copias de seguridad y el escalado (FASE 14+) se planifican sobre un motor conocido.
