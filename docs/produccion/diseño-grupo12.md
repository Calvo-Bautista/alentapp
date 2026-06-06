# Diseño de Infraestructura para Producción

**Grupo:** 12
**Integrantes:** Pedro Moyano, Milagros Reale, Franco Jiménez, Franco Portillo, Bautista Calvo
**Actividad:** TP Integrador - Actividad 4, Fase 2

---

## 2.1. Diseño de la infraestructura Docker

A partir de los problemas identificados en la Fase 1 por cada integrante, se diseña la infraestructura Docker optimizada para producción. Se especifican tres archivos: `Dockerfile.prod` para la API, `Dockerfile.prod` para el frontend, y `docker-compose.prod.yml`.

### a) `packages/api/Dockerfile.prod` — Multi-stage build

**Propósito:** Construir una imagen de producción para la API Fastify que contenga únicamente el código JavaScript compilado y las dependencias de producción, eliminando herramientas de desarrollo (`tsx`, `vitest`, `prisma CLI`, `typescript`) y reduciendo significativamente el tamaño de la imagen.

**Estructura — 3 etapas:**

| Etapa | Nombre | Base | Propósito |
|-------|--------|------|-----------|
| Stage 1 | `deps` | `node:22-alpine` | Instalar solo dependencias de producción con `npm ci --omit=dev`. Copiar `package.json` y `package-lock.json` del workspace raíz y de cada paquete (`api`, `shared`) para aprovechar el caché de capas Docker. |
| Stage 2 | `build` | `node:22-alpine` | Instalar todas las dependencias (incluyendo devDependencies), compilar TypeScript a JavaScript (`tsc`), y ejecutar `prisma generate` para generar el cliente de Prisma. Esta etapa necesita las devDependencies pero no se incluye en la imagen final. |
| Stage 3 | `runtime` | `node:22-alpine` | Copiar desde `deps` los `node_modules` de producción, y desde `build` el código JavaScript compilado y el cliente Prisma generado. Ejecutar con usuario no-root. |

**Pseudocódigo del Dockerfile:**

```dockerfile
# ── Stage 1: deps ──────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --omit=dev

# ── Stage 2: build ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci                          # Incluye devDeps (tsc, prisma, tsx)
COPY packages/shared/ ./packages/shared/
COPY packages/api/ ./packages/api/
COPY tsconfig.json ./
RUN npx prisma generate --config packages/api/prisma.config.ts
RUN npx tsc -p packages/api/tsconfig.json   # Compilar TS → JS

# ── Stage 3: runtime ──────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copiar dependencias de producción desde stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules

# Copiar código compilado desde stage 2
COPY --from=build /app/packages/api/dist ./packages/api/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/api/src/generated ./packages/api/src/generated

COPY packages/api/package.json ./packages/api/
COPY package.json ./

# Usuario no-root
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider --quiet http://localhost:3000/ || exit 1

CMD ["node", "packages/api/dist/app.js"]
```

**Requisitos no funcionales:**

- **Tamaño objetivo:** ≤ 300 MB (reducción ≥ 70% respecto a la imagen actual de ~1 GB)
- **Tiempo de startup:** < 5 segundos
- **Usuario:** `node` (no-root, ya incluido en la imagen base `node:alpine`)
- **Healthcheck:** `wget --spider http://localhost:3000/` cada 30s
- **Sin herramientas de build:** la imagen final no debe contener `tsc`, `tsx`, `npm` (salvo node), `vitest`, ni `prisma CLI`
