# frontend/

Cliente web de DRIVEAM: Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind CSS v4.

> **Nota:** Next.js 16 introduce cambios importantes respecto a versiones anteriores.
> Antes de tocar código, consulta las guías en `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## Estructura

```
src/
├── app/              rutas (App Router): layout, page, globals.css
├── components/       componentes de presentación
│   └── ui/           sistema de componentes reutilizables (semilla: button.tsx)
├── lib/              utilidades (api.ts: cliente HTTP; cn.ts: clases Tailwind)
├── features/         organización por feature (se llena a partir de FASE 3)
├── hooks/  types/
```

## Scripts

```bash
npm run dev          # servidor de desarrollo (http://localhost:3000)
npm run build        # build de producción (salida standalone)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (una pasada)
npm run test:watch   # Vitest en modo watch
npm run format       # Prettier --write
```

## Variables de entorno

- `NEXT_PUBLIC_API_BASE_URL` — URL de la API desde el navegador (por defecto `http://localhost:8000`).
- `API_BASE_URL_INTERNAL` — URL de la API desde el servidor de Next dentro de Docker
  (por defecto `http://backend:8000`).

Ver `.env.example` en la raíz del repo.
