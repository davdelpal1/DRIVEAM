# PLAN.md

# Plan de desarrollo — DRIVEAM

Este documento define la hoja de ruta inicial.

Regla principal:

> **Cada fase debe terminar con software utilizable.**

---

# FASE 0 — Fundación del proyecto

## Objetivo

Crear una base sólida que permita desarrollar sin acumular deuda técnica desde el inicio.

### Repositorio

- [ ] Crear repositorio GitHub.
- [ ] Configurar rama `main`.
- [ ] Añadir `.gitignore`.
- [ ] Añadir `.editorconfig`.
- [ ] Añadir `.env.example`.
- [ ] Añadir `CHANGELOG.md`.
- [ ] Añadir documentación inicial.

### Estructura

- [ ] Crear `/frontend`.
- [ ] Crear `/backend`.
- [ ] Crear `/docs`.
- [ ] Crear `/scripts`.
- [ ] Crear `/.github/workflows`.

### Frontend

- [ ] Inicializar Next.js.
- [ ] TypeScript strict.
- [ ] Configurar Tailwind.
- [ ] Configurar ESLint.
- [ ] Configurar Prettier.
- [ ] Crear layout base.
- [ ] Crear sistema inicial de componentes.

### Backend

- [ ] Inicializar Django.
- [ ] Instalar Django REST Framework.
- [ ] Configurar PostgreSQL.
- [ ] Configurar variables de entorno.
- [ ] Configurar pytest.
- [ ] Configurar linting.
- [ ] Crear `/api/v1/`.
- [ ] Añadir endpoint `/health/`.

### Docker

- [ ] Dockerfile frontend.
- [ ] Dockerfile backend.
- [ ] PostgreSQL.
- [ ] `docker-compose.yml`.
- [ ] Documentar arranque local.

### CI

- [ ] GitHub Actions frontend lint.
- [ ] Typecheck.
- [ ] Backend lint.
- [ ] Tests backend.
- [ ] Build frontend.

### Definición de terminado

```text
git clone
→ configurar .env
→ docker compose up
→ frontend disponible
→ backend disponible
→ PostgreSQL conectado
→ CI verde
```

---

# FASE 1 — Modelo de dominio

## Objetivo

Representar correctamente coches y anuncios antes de construir funcionalidades complejas.

### Django apps

- [ ] `accounts`
- [ ] `vehicles`
- [ ] `listings`
- [ ] `sources`
- [ ] `favorites`
- [ ] `finance`
- [ ] `scoring`

### Modelos

- [ ] Source.
- [ ] Seller.
- [ ] Vehicle.
- [ ] Listing.
- [ ] ListingSnapshot.
- [ ] FinanceOffer.
- [ ] Favorite.
- [ ] UserVehicleNote.
- [ ] UserPreference.
- [ ] Score.

### Enums

- [ ] FuelType.
- [ ] Transmission.
- [ ] SellerType.
- [ ] ListingStatus.
- [ ] IntegrationType.

### API

- [ ] serializers.
- [ ] viewsets/endpoints.
- [ ] filtros básicos.
- [ ] paginación.
- [ ] OpenAPI.

### Tests

- [ ] creación Vehicle.
- [ ] creación Listing.
- [ ] relaciones.
- [ ] validaciones.
- [ ] API básica.

### Definición de terminado

Puede crearse desde API un vehículo, asociarlo a un anuncio y consultarlo desde frontend.

---

# FASE 2 — Autenticación y perfil

## Objetivo

Permitir utilizar la plataforma como herramienta personal.

### Backend

- [ ] Registro.
- [ ] Login.
- [ ] Logout.
- [ ] Usuario autenticado.
- [ ] Permisos.
- [ ] UserPreference.

### Frontend

- [ ] Login.
- [ ] Registro.
- [ ] Sesión.
- [ ] Perfil.
- [ ] Preferencias de compra.

### Preferencias iniciales

- [ ] presupuesto objetivo.
- [ ] presupuesto máximo.
- [ ] año mínimo.
- [ ] kilometraje máximo.
- [ ] combustible.
- [ ] carrocería.
- [ ] prioridades.

### Definición de terminado

Un usuario puede iniciar sesión y guardar sus criterios de búsqueda.

---

# FASE 3 — Añadir vehículo manualmente

## Objetivo

Tener una aplicación útil sin depender todavía del scraping.

### UI

Pantalla:

```text
Nuevo candidato
```

Campos:

- [ ] marca.
- [ ] modelo.
- [ ] versión.
- [ ] combustible.
- [ ] potencia.
- [ ] año.
- [ ] kilómetros.
- [ ] precio contado.
- [ ] precio financiado.
- [ ] vendedor.
- [ ] garantía.
- [ ] ubicación.
- [ ] URL.
- [ ] notas.

### Funciones

- [ ] crear.
- [ ] editar.
- [ ] eliminar.
- [ ] archivar.
- [ ] favorito.

### Definición de terminado

El usuario puede sustituir una hoja de cálculo por la aplicación.

---

# FASE 4 — Dashboard “Mis coches”

## Objetivo

Gestionar rápidamente todos los candidatos.

### Pantalla principal

- [ ] tarjetas/listado.
- [ ] fotografía o placeholder.
- [ ] marca/modelo.
- [ ] precio.
- [ ] año.
- [ ] kilómetros.
- [ ] score.
- [ ] fuente.
- [ ] favorito.

### Filtros

- [ ] precio.
- [ ] año.
- [ ] km.
- [ ] combustible.
- [ ] estado.
- [ ] favorito.

### Ordenación

- [ ] precio.
- [ ] score.
- [ ] km.
- [ ] año.
- [ ] fecha añadido.

### Estados personalizados

```text
NEW
INTERESTED
CONTACTED
VISIT
DISCARDED
PURCHASED
```

- [ ] implementar estados.
- [ ] permitir cambiar estado rápidamente.

### Definición de terminado

El usuario puede gestionar toda su búsqueda desde una sola pantalla.

---

# FASE 5 — Comparador

## Objetivo

Comparar entre 2 y 5 coches.

### UI

- [ ] selector de candidatos.
- [ ] tabla comparativa.
- [ ] sticky columns en desktop.
- [ ] diseño usable en móvil.

### Comparar

- [ ] precio.
- [ ] año.
- [ ] kilómetros.
- [ ] potencia.
- [ ] consumo.
- [ ] financiación.
- [ ] garantía.
- [ ] vendedor.
- [ ] score.

### Indicadores

Ejemplo:

```text
MENOR PRECIO       ✓
MENOS KM           ✓
MÁS NUEVO          ✓
MEJOR SCORE        ✓
```

### Definición de terminado

El usuario puede decidir visualmente qué vehículo destaca en cada criterio.

---

# FASE 6 — Calculadora de financiación

## Objetivo

Mostrar el coste real.

### Datos

- [ ] precio.
- [ ] entrada.
- [ ] importe financiado.
- [ ] cuota.
- [ ] número de cuotas.
- [ ] cuota final.
- [ ] apertura.
- [ ] TIN.
- [ ] TAE.
- [ ] productos adicionales.

### Cálculos

- [ ] total cuotas.
- [ ] coste financiación.
- [ ] coste total coche.
- [ ] diferencia frente contado.
- [ ] coste anual aproximado.

### Tests obligatorios

Casos financieros deben tener tests unitarios deterministas.

### Definición de terminado

El usuario entiende en euros el coste real de cada alternativa.

---

# FASE 7 — Car Score V1

## Objetivo

Ordenar candidatos según las preferencias del usuario.

### Factores

- [ ] precio.
- [ ] kilómetros.
- [ ] año.
- [ ] consumo.
- [ ] financiación.
- [ ] garantía.

Fiabilidad se añadirá solo cuando dispongamos de una fuente de datos fiable.

### Reglas

- [ ] pesos configurables.
- [ ] score 0-100.
- [ ] breakdown.
- [ ] versión del algoritmo.

### UI

```text
87/100
Muy buen candidato
```

Con explicación:

```text
Precio        92
Kilómetros    87
Antigüedad    83
Financiación  74
```

### Definición de terminado

Dos usuarios con prioridades distintas pueden obtener rankings distintos.

---

# FASE 8 — Importación mediante URL

## Objetivo

Reducir drásticamente el esfuerzo de introducir un candidato.

### Backend

- [ ] SourceAdapter base.
- [ ] Registry.
- [ ] URL matcher.
- [ ] endpoint `/listings/import/`.
- [ ] validación de URL.
- [ ] prevención SSRF.
- [ ] errores estructurados.

### Primer adaptador

Elegir únicamente una fuente técnicamente y legalmente adecuada para la fase de prueba.

- [ ] parser.
- [ ] fixtures HTML.
- [ ] tests.
- [ ] documentación de la fuente.

### UX

```text
Pegar enlace
→ detectar fuente
→ importar
→ revisar datos
→ guardar
```

### Importante

Los datos importados deben mostrarse para revisión antes de guardarse definitivamente.

### Definición de terminado

El usuario puede añadir un candidato pegando una URL compatible.

---

# FASE 9 — Historial

## Objetivo

Conocer cómo cambia cada anuncio.

### Backend

- [ ] ListingSnapshot.
- [ ] detección de cambio.
- [ ] historial precio.
- [ ] estado ACTIVE / REMOVED.

### Frontend

- [ ] gráfico de precio.
- [ ] primera detección.
- [ ] última actualización.
- [ ] cambio total.

Ejemplo:

```text
Precio inicial   11.490 €
Actual           10.490 €
Cambio           -1.000 €
```

### Definición de terminado

La aplicación muestra cómo ha evolucionado un candidato.

---

# FASE 10 — Procesamiento asíncrono

## Objetivo

Actualizar candidatos sin bloquear peticiones web.

Solo realizar cuando Fase 9 lo necesite.

### Infraestructura

- [ ] Redis.
- [ ] Celery.
- [ ] worker.
- [ ] beat.
- [ ] retries.
- [ ] timeout.
- [ ] observabilidad.

### Jobs

- [ ] refresh listing.
- [ ] calculate score.
- [ ] snapshots.

### Definición de terminado

Actualizar un anuncio no bloquea la API.

---

# FASE 11 — Alertas

## Objetivo

Avisar de cambios relevantes.

### Eventos

- [ ] bajada de precio.
- [ ] coche eliminado.
- [ ] nueva oferta mejor.
- [ ] financiación modificada.

### Canales

Primero:

- [ ] notificación dentro de la app.

Después:

- [ ] email.

Mobile:

- [ ] push.

### Definición de terminado

El usuario no necesita revisar diariamente todos los anuncios.

---

# FASE 12 — Deduplicación

## Objetivo

Detectar el mismo vehículo en varias fuentes.

### V1

Reglas:

- [ ] seller.
- [ ] marca/modelo.
- [ ] año.
- [ ] kilómetros aproximados.
- [ ] ubicación.
- [ ] versión.

### Resultado

```text
possible_duplicate
confidence
```

### UI

```text
Posible mismo vehículo encontrado en 2 fuentes
```

No fusionar automáticamente.

---

# FASE 13 — Fuentes adicionales

## Objetivo

Añadir integraciones de forma controlada.

Para cada fuente:

- [ ] estudiar términos.
- [ ] documentar permisos.
- [ ] definir IntegrationType.
- [ ] implementar adapter.
- [ ] tests.
- [ ] monitoring.
- [ ] política de refresh.

No integrar una fuente únicamente porque sea técnicamente scrapeable.

---

# FASE 14 — Beta privada

## Objetivo

Probar con usuarios reales.

### Producto

- [ ] onboarding.
- [ ] recuperación contraseña.
- [ ] privacidad.
- [ ] términos.
- [ ] feedback.
- [ ] analytics.

### Infraestructura

- [ ] staging.
- [ ] production.
- [ ] backups.
- [ ] error tracking.
- [ ] logs.

### Métricas

- [ ] usuarios activos.
- [ ] vehículos guardados.
- [ ] comparaciones.
- [ ] imports.
- [ ] errores por fuente.

---

# FASE 15 — Web pública y SEO

## Objetivo

Convertir la herramienta en producto descubrible.

### SEO técnico

- [ ] metadata.
- [ ] sitemap.
- [ ] robots.
- [ ] canonical.
- [ ] structured data.
- [ ] performance.
- [ ] Core Web Vitals.

### Contenido

- [ ] páginas marca.
- [ ] páginas modelo.
- [ ] guías.
- [ ] comparativas.

Solo publicar datos de terceros cuando tengamos derecho para hacerlo.

---

# FASE 16 — PWA

Evaluar antes de desarrollar aplicación nativa.

- [ ] installable.
- [ ] manifest.
- [ ] offline básico.
- [ ] share target si es viable.

Evaluar si satisface suficiente funcionalidad móvil.

---

# FASE 17 — Aplicación móvil

## Tecnología

React Native + Expo.

### Funciones iniciales

- [ ] login.
- [ ] favoritos.
- [ ] comparador.
- [ ] detalle.
- [ ] alertas.
- [ ] compartir URL hacia DRIVEAM.

### Publicación

- [ ] Play Store.
- [ ] App Store.

Antes:

- [ ] revisar derechos de contenido.
- [ ] políticas de privacidad.
- [ ] permisos.
- [ ] eliminación de cuenta.
- [ ] gestión de suscripciones si existen.

---

# FASE 18 — IA

Solo cuando tengamos suficiente dato estructurado.

### Casos de uso

- [ ] resumen de candidato.
- [ ] comparación explicada.
- [ ] preguntas al vendedor.
- [ ] análisis de descripción.
- [ ] consulta natural sobre favoritos.

Ejemplo:

```text
¿Cuál de mis favoritos es mejor para hacer 25.000 km al año?
```

La IA recibe datos internos.

No navega libremente ni inventa especificaciones.

---

# FASE 19 — Inteligencia de mercado

### Datos

- [ ] precio mediano.
- [ ] distribución.
- [ ] kilómetros medios.
- [ ] depreciación.
- [ ] days-on-market.

### Score V2

Comparar vehículo contra cohortes:

```text
marca
modelo
versión
año
kilómetros
zona
```

---

# FASE 20 — Monetización

Solo después de validar uso.

Opciones:

- [ ] premium.
- [ ] afiliación.
- [ ] leads.
- [ ] informes.
- [ ] servicios complementarios.
- [ ] B2B.

Principio:

> La monetización no debe alterar de forma oculta el ranking.

---

# BACKLOG DE IDEAS

No implementar sin priorización.

- [ ] OCR de documentos.
- [ ] lector de matrícula.
- [ ] VIN decoder.
- [ ] coste seguro.
- [ ] coste impuesto.
- [ ] coste mantenimiento.
- [ ] estimación depreciación.
- [ ] comparador gasolina vs diésel.
- [ ] recomendación por km/año.
- [ ] checklist de inspección.
- [ ] modo “voy a visitar este coche”.
- [ ] preguntas para concesionario.
- [ ] guardar respuestas del vendedor.
- [ ] subir informe mecánico.
- [ ] compartir comparación.
- [ ] colecciones.
- [ ] colaboración familiar.
- [ ] exportar PDF.

---

# PRIORIDAD INMEDIATA

El orden de trabajo recomendado es:

```text
FASE 0
↓
FASE 1
↓
FASE 2
↓
FASE 3
↓
FASE 4
↓
FASE 5
↓
FASE 6
↓
FASE 7
↓
FASE 8
```

Después de Fase 8:

**parar y evaluar el producto utilizando datos reales.**

No continuar automáticamente al resto del roadmap.

---

# Primera milestone

## Milestone: PERSONAL MVP

Debe incluir:

- autenticación;
- preferencias;
- añadir coche manualmente;
- favoritos;
- notas;
- dashboard;
- comparador;
- financiación;
- Car Score V1;
- importación de URL para al menos una fuente.

Cuando esto funcione correctamente, tendremos la primera versión verdaderamente útil del producto.
