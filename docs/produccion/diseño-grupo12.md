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

---

### b) `packages/web/Dockerfile.prod` — Multi-stage build

**Propósito:** Construir una imagen de producción para el frontend React+Vite que compile los assets estáticos (HTML/CSS/JS minificados) y los sirva con nginx, reemplazando completamente el servidor de desarrollo de Vite.

**Estructura — 3 etapas:**

| Etapa | Nombre | Base | Propósito |
|-------|--------|------|-----------|
| Stage 1 | `deps` | `node:22-alpine` | Instalar todas las dependencias necesarias para el build (Vite, TypeScript, React, etc.) usando `npm ci`. |
| Stage 2 | `build` | `node:22-alpine` | Ejecutar `npm run build -w packages/web` (que internamente hace `tsc -b && vite build`) generando los archivos estáticos optimizados y minificados en `packages/web/dist`. |
| Stage 3 | `runtime` | `nginx:stable-alpine` | Copiar los archivos estáticos compilados al directorio de nginx. Servir con configuración optimizada para producción. |

**Pseudocódigo del Dockerfile:**

```dockerfile
# ── Stage 1: deps ──────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

# ── Stage 2: build ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared/ ./packages/shared/
COPY packages/web/ ./packages/web/
COPY tsconfig.json ./
COPY package.json ./
RUN npm run build -w packages/web   # tsc -b && vite build → packages/web/dist

# ── Stage 3: runtime ──────────────────────────────────────────
FROM nginx:stable-alpine AS runtime

# Copiar archivos estáticos compilados
COPY --from=build /app/packages/web/dist /usr/share/nginx/html

# Configuración personalizada de nginx
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --spider --quiet http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Configuración de nginx (`packages/web/nginx.conf`):**

Se diseña una configuración de nginx optimizada para producción que incluya:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Compresión gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript
               image/svg+xml;

    # Cache de assets estáticos (JS, CSS, imágenes con hash de Vite)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SPA: redirigir rutas no encontradas a index.html (para React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Requisitos no funcionales:**

- **Tamaño objetivo:** ≤ 50 MB (nginx:stable-alpine + archivos estáticos minificados)
- **Compresión:** gzip habilitado para texto, CSS, JS y SVG
- **Caché:** assets con hash de Vite configurados con `expires 1y` e `immutable`
- **Seguridad:** headers de protección (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- **SPA routing:** `try_files` para que React Router funcione correctamente
- **Healthcheck:** `wget --spider http://localhost:80/` cada 30s

---

### `.dockerignore` mejorado

Para ambos Dockerfiles, se propone ampliar el `.dockerignore` actual para excluir archivos innecesarios del contexto de build:

```dockerignore
node_modules
dist
.git
*.log
.env
.env.*
*.pdf
docs/
e2e-fullstack/
playwright-report-fullstack/
test-results/
.eslintrc.js
.prettierrc.json
.editorconfig
*.test.ts
*.spec.ts
__tests__/
coverage/
.vscode/
```
