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


**Requisitos no funcionales:**

- **Tamaño objetivo:** ≤ 50 MB (nginx:stable-alpine + archivos estáticos minificados)
- **Compresión:** gzip habilitado para texto, CSS, JS y SVG
- **Caché:** assets con hash de Vite configurados con `expires 1y` e `immutable`
- **Seguridad:** headers de protección (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- **SPA routing:** `try_files` para que React Router funcione correctamente
- **Healthcheck:** `wget --spider http://localhost:80/` cada 30s

---

### c) `docker-compose.prod.yml`

#### Propósito

El archivo `docker-compose.prod.yml` tiene como propósito definir la configuración de ejecución del sistema en un entorno productivo. A diferencia del `docker-compose.yml` utilizado para desarrollo, este archivo debe estar orientado a levantar los servicios con una configuración más segura, estable y controlada.

Este compose productivo será responsable de orquestar los servicios principales del sistema:

* `api`: backend.
* `web`: frontend servido mediante nginx.
* `db`: base de datos PostgreSQL.

La necesidad de este archivo surge porque el entorno productivo no debe depender de herramientas de desarrollo como hot reload, watchers, servidores de desarrollo o variables hardcodeadas. En producción se busca que los contenedores ejecuten imágenes ya construidas, con permisos limitados, healthchecks, límites de recursos, logging controlado y configuración externa mediante variables de entorno.

De esta manera, `docker-compose.prod.yml` permite separar claramente la configuración de desarrollo de la configuración de producción, evitando mezclar necesidades distintas dentro de un mismo archivo.

---

#### Estructura propuesta

El archivo se organizará en las siguientes secciones principales:


---

#### Servicio `api`

El servicio `api` ejecutará la imagen productiva del backend, construida a partir de `packages/api/Dockerfile.prod`.

Su responsabilidad será exponer la API en el puerto correspondiente, conectarse a la base de datos y ejecutar únicamente el código JavaScript compilado, sin herramientas de desarrollo como `tsx`, `tsc` o dependencias innecesarias.

La configuración esperada para este servicio incluye:

* Imagen construida desde `packages/api/Dockerfile.prod`.
* Variables de entorno cargadas desde `.env`.
* Dependencia de la base de datos mediante `depends_on`.
* Healthcheck contra `localhost:3000`.
* Límites de CPU y memoria.
* Filesystem de solo lectura.
* Usuario no-root definido desde la imagen.
* Capabilities mínimas.
* Política de seguridad `no-new-privileges`.
* Logging con rotación.

---

#### Servicio `web`

El servicio `web` ejecutará la imagen productiva del frontend, construida desde `packages/web/Dockerfile.prod`.

A diferencia del entorno de desarrollo, el frontend no debería ejecutarse con `npm run dev` ni depender del servidor de desarrollo de Vite. En producción, Vite genera archivos estáticos mediante el build, y esos archivos deben ser servidos por nginx.

La configuración esperada para este servicio incluye:

* Imagen construida desde `packages/web/Dockerfile.prod`.
* Exposición del puerto `80`.
* Healthcheck contra `localhost:80`.
* Configuración de seguridad con privilegios mínimos.
* Logging con rotación.
* Red interna personalizada.
* Dependencia opcional de la API, si el frontend necesita que esté disponible para funcionar correctamente.

Se agrega `NET_BIND_SERVICE` porque nginx necesita poder escuchar en el puerto 80 dentro del contenedor. El resto de capabilities se eliminan para reducir permisos innecesarios.

---

#### Servicio `db`

El servicio `db` ejecutará PostgreSQL como base de datos del sistema. Será el único servicio con un volumen persistente, ya que la información almacenada debe sobrevivir aunque el contenedor sea eliminado o recreado.

La configuración esperada incluye:

* Imagen oficial de PostgreSQL.
* Variables sensibles cargadas desde `.env`.
* Volumen persistente para los datos.
* Healthcheck con `pg_isready`.
* Red interna personalizada.
* Logging con rotación.
* Límites de CPU y memoria.

En este caso, la base de datos no debe tener sus credenciales hardcodeadas dentro del archivo compose. Esas variables deben provenir del archivo `.env`.

---

#### Variables sensibles y configuración por entorno

Las variables sensibles no deben escribirse directamente en `docker-compose.prod.yml`. En su lugar, deben cargarse desde un archivo `.env`.

---

#### Requisitos no funcionales

| Requisito                  | Diseño propuesto                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Disponibilidad             | Healthchecks para API y DB, permitiendo detectar servicios no saludables.                                              |
| Seguridad                  | Uso de `read_only: true`, `cap_drop: ALL`, `cap_add: NET_BIND_SERVICE` solo donde sea necesario y `no-new-privileges`. |
| Configuración externa      | Variables sensibles cargadas desde `.env`, evitando valores hardcodeados.                                              |
| Administración de recursos | Definición de límites de CPU y memoria por servicio.                                                                   |
| Logging                    | Logging con driver `json-file` y rotación mediante `max-size: 10m` y `max-file: 3`.                                    |
| Aislamiento                | Red interna personalizada.                                                                                             |
| Persistencia               | Volumen dedicado para PostgreSQL.                                                                                      |
| Tiempo de startup          | Se espera que los servicios principales estén disponibles en menos de 30 segundos en un entorno local estándar.        |
| Estabilidad                | La API debe esperar a que la base de datos esté saludable antes de iniciar su funcionamiento completo.                 |

---
## 2.2. Diseño de la observabilidad 

### a) Métricas RED a capturar

Se definen las siguientes métricas para instrumentar la API de alentapp, siguiendo la metodología RED (Rate, Errors, Duration):

| Métrica      | Nombre técnico             | Tipo OTel | Descripción                                                | Labels                      |
| :----------- | :------------------------- | :-------- | :--------------------------------------------------------- | :-------------------------- |
| **Rate**     | `http_requests_total`      | Counter   | Cuenta el total de peticiones HTTP recibidas por la API    | `method`, `route`, `status` |
| **Errors**   | `http_errors_total`        | Counter   | Cuenta las peticiones que resultan en error (HTTP 4xx/5xx) | `method`, `route`, `status` |
| **Duration** | `http_request_duration_ms` | Histogram | Registra la latencia de cada petición en milisegundos      | `method`, `route`           |

**Métricas adicionales (Gauge):**

| Nombre técnico               | Tipo OTel     | Descripción                                    |
| :--------------------------- | :------------ | :--------------------------------------------- |
| `process_memory_usage_bytes` | Gauge         | Memoria RAM consumida por el proceso Node.js   |
| `http_requests_active`       | UpDownCounter | Cantidad de peticiones en curso (concurrencia) |

**Endpoints instrumentados:**

Las métricas se capturarán de forma global para todos los endpoints de la API, siendo los principales:

| Recurso              | Rutas                          | Operaciones                     |
| :------------------- | :----------------------------- | :------------------------------ |
| Socios               | `/api/v1/socios`               | GET, POST, PUT, DELETE          |
| Pagos                | `/api/v1/payments`             | GET, POST, PUT, DELETE (cancel) |
| Certificados Médicos | `/api/v1/medical-certificates` | GET, POST, PUT, DELETE          |
| Disciplinas          | `/api/v1/disciplinas`          | GET, POST, PUT, DELETE          |
| Deportes             | `/api/v1/sports`               | GET, POST, PUT, DELETE          |
| Lockers              | `/api/v1/lockers`              | GET, POST, PUT, DELETE          |

**Escenarios de verificación:**

- DADO 10 requests a `GET /api/v1/socios` en 1 minuto → ENTONCES `rate(http_requests_total)` ≈ 0.166 req/s
- DADO un `POST /api/v1/payments` con datos inválidos → ENTONCES `http_errors_total{status="400"}` se incrementa en 1
- DADO requests exitosos a `GET /api/v1/lockers` → ENTONCES el percentil 50 de `http_request_duration_ms` < 500ms
