# 0007 — Autenticación por sesión y login por email (FASE 2)

- **Estado:** aceptada
- **Fecha:** 2026-09-01

## Contexto

La FASE 2 de [PLAN.md](../../PLAN.md) hace de DRIVEAM una herramienta personal usable: registro,
login, logout y un perfil de preferencias de compra editable. `ARCHITECTURE.md` §13 fija
"email + contraseña, sin OAuth hasta necesitarlo" y §14 exige CORS restrictivo, protección CSRF
según la estrategia de auth y rate limiting en endpoints sensibles. El ADR 0006 dejó los
viewsets del catálogo con `IsAuthenticatedOrReadOnly` "provisional, a revisar aquí".

El frontend es Next.js (App Router) con render en servidor y en cliente, en un origen distinto
al de la API (`localhost:3000` ↔ `localhost:8000` en local; `app.` ↔ `api.` de un mismo dominio
en producción). Ya estaba configurado `SessionAuthentication` de DRF y `django-cors-headers`.

## Decisión

1. **Autenticación por sesión de Django** (cookie `sessionid` httpOnly), no tokens. El navegador
   habla directamente con la API con `credentials: "include"`; los Server Components reenvían la
   cabecera `Cookie` a la API (`src/lib/server-api.ts`). Es la opción más segura aquí: reutiliza
   la maquinaria probada de sesiones y CSRF de Django (cookie no accesible por JS, revocación
   server-side con `logout`, expiración) en lugar de código propio de proxy o de gestión de
   tokens. Endurecimiento en `config/settings`: `SESSION_COOKIE_HTTPONLY`, `SameSite=Lax`
   (configurable), `CORS_ALLOW_CREDENTIALS=True` con allowlist explícita (nunca `*`).

2. **CSRF por doble envío**: `GET /api/v1/auth/csrf/` (`@ensure_csrf_cookie`) fija la cookie
   `csrftoken`; el frontend la lee y la manda en `X-CSRFToken` en las peticiones de escritura
   (`apiMutate` en `src/lib/api.ts`). `CSRF_TRUSTED_ORIGINS` autoriza el origen del frontend
   para la comprobación de `Origin` de Django.

3. **Email como identificador** (`USERNAME_FIELD = "email"`, sin `username`), con `UserManager`
   propio. Migración limpia ahora (no hay datos reales); encaja con el registro público futuro.

4. **Endpoints hechos a mano** en `apps/accounts/api.py` (`register`, `login`, `logout`, `me`,
   `csrf`, `preferences`), sin `dj-rest-auth`/`allauth`: son ~150 líneas bajo nuestro control y
   evitan una dependencia grande. `preferences/` es un `RetrieveUpdateAPIView` singleton que
   autocrea la fila del usuario.

5. **Rate limiting** con `ScopedRateThrottle` de DRF en login (`10/min`) y registro (`5/hour`).
   El mensaje del `429` se reescribe en español natural con un `EXCEPTION_HANDLER` propio
   (`apps/core/exceptions.py`), en lugar de la traducción literal de DRF.

6. **Registro abierto** con flag `REGISTRATION_ENABLED` (env, por defecto `True`).

7. **Permisos del catálogo revisados**: `Source` es configuración del sistema → escritura solo
   para `is_staff` (`IsAdminUserOrReadOnly` en `apps/core/permissions.py`); `Seller`, `Vehicle`
   y `Listing` mantienen `IsAuthenticatedOrReadOnly` (los usuarios autenticados alimentan el
   catálogo compartido; la propiedad por usuario llega con favoritos/seguimiento en FASE 3–4).

8. **E2E con Playwright** (Chromium): el navegador se ejecuta en el host / runner y ataca al
   stack de Docker Compose por `localhost` como un navegador real. Se descarta ejecutar
   Playwright en un contenedor dentro de la red de Compose porque `frontend` y `backend` son
   hosts distintos sin dominio padre común y la cookie de sesión no se compartiría.

## Alternativas consideradas

- **Token / JWT en cookie httpOnly gestionada por Next** — sin CSRF, funciona entre dominios no
  relacionados, pero añade una capa de proxy y código propio de sesión (más superficie de
  error), y los tokens de DRF no expiran y se guardan en claro. Descartada por seguridad y coste.
- **`next.config` con rewrite `/api/*` → Django (mismo origen)** — elimina CORS y los casos
  límite de cookies entre sitios, pero acopla el despliegue del frontend y la API y oculta el
  origen real. Se puede adoptar más adelante si aparece un despliegue en dominios no
  relacionados; hoy no hace falta.
- **Mantener `username` + email único** — menos cambios ahora, pero deja `username` como campo
  muerto para siempre y complica el `authenticate` por email. Descartada.
- **`dj-rest-auth` + `django-allauth`** — resuelve más de lo que la fase necesita (verificación
  de email, social, plantillas) a cambio de una dependencia grande. Se reconsiderará en la beta
  privada (FASE 14: recuperación de contraseña, onboarding).

## Consecuencias

- El usuario puede registrarse, iniciar sesión y guardar sus criterios de compra; el guard real
  de las páginas privadas es server-side (`getCurrentUser()`), con una comprobación optimista en
  `frontend/src/proxy.ts`.
- Todas las páginas pasan a renderizarse bajo demanda (el layout lee la sesión); aceptable para
  una herramienta personal. Si el rendimiento importa, mover el `await` a un componente con
  `<Suspense>`.
- La auth por sesión asume que frontend y API comparten *site*. Un despliegue en dominios no
  relacionados exigiría `SameSite=None; Secure` (configurable por env) o el rewrite del punto
  descartado.
- El throttling usa `LocMemCache` (por proceso). Producción con varios procesos necesitará caché
  compartida (Redis llega en FASE 10).
- A revisar cuando: la FASE 3–4 introduzca seguimiento por usuario del catálogo (¿propiedad de
  `Listing`?); la FASE 14 pida recuperación de contraseña y verificación de email.
