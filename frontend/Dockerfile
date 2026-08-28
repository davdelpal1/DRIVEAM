# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

# ============================================================
# development — servidor de desarrollo con recarga.
# El código se monta por bind mount desde docker-compose y las
# dependencias se sincronizan al arrancar (ver `command`).
# ============================================================
FROM base AS development
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ============================================================
# build — compila la salida `standalone`.
# (sin NODE_ENV=production aquí: npm ci debe instalar devDependencies;
#  `next build` ya fuerza producción en la salida)
# ============================================================
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ============================================================
# production — imagen mínima, usuario sin privilegios.
# ============================================================
FROM base AS production
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 \
    HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
