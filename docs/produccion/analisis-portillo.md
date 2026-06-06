# Análisis de Infraestructura para Producción

**Autor:** portillo (Franco Portillo)
**Actividad:** TP Integrador - Actividad 4, Fase 1

---

## 1. Analizar la infraestructura Docker actual

Se revisaron los archivos `docker-compose.yml`, `packages/api/Dockerfile` y `packages/web/Dockerfile` del proyecto. A continuación se documentan 5 problemas o vulnerabilidades identificados respecto a buenas prácticas de producción.

| # | Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|----------|----------------|---------|-------------------|
| 1 | **Imagen base pesada y single-stage build** | `packages/api/Dockerfile:1` y `packages/web/Dockerfile:1` — ambos usan `node:20-alpine` como única etapa, incluyendo `npm install` completo (devDependencies + dependencias de build como `tsx`, `typescript`, `vitest`, `prisma`) en la imagen final. | Alto | Implementar multi-stage builds con 3 etapas: `deps` (solo dependencias de producción con `npm ci --omit=dev`), `build` (compilación TypeScript) y `runtime` (solo JS compilado + node_modules de producción). Para el frontend, la etapa final debería usar `nginx:stable-alpine` en lugar de Node.js. Esto reduciría el tamaño de la imagen de ~1 GB a ~300 MB (API) y de ~570 MB a ~170 MB (Web). |
| 2 | **Ejecución como usuario root y filesystem de lectura-escritura** | `packages/api/Dockerfile` y `packages/web/Dockerfile` — no definen `USER` no-root. `docker-compose.yml` — no utiliza `read_only: true`, `cap_drop: ALL`, ni `security_opt: no-new-privileges`. | Alto | Agregar `USER node` (o crear un `appuser`) en la etapa final del Dockerfile. En el compose de producción, configurar `read_only: true`, `cap_drop: ALL`, `cap_add: [NET_BIND_SERVICE]` y `security_opt: [no-new-privileges]`. Esto sigue el principio de mínimo privilegio y limita el impacto de una posible vulnerabilidad. |
| 3 | **Credenciales hardcodeadas en docker-compose.yml** | `docker-compose.yml:6-8` — `POSTGRES_USER: admin`, `POSTGRES_PASSWORD: password123`, `POSTGRES_DB: alentapp_db` están directamente en el archivo. Línea 30: `DATABASE_URL=postgres://admin:password123@db:5432/alentapp_db` expone la contraseña en texto plano. | Alto | Extraer todas las credenciales a un archivo `.env` externo (ignorado por `.gitignore`) y referenciarlas con `${VARIABLE}` en el compose. Ejemplo: `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}`. También evaluar el uso de Docker Secrets para producción. |
| 4 | **Ausencia de resource limits (CPU/memoria)** | `docker-compose.yml` — ninguno de los servicios (`api`, `web`, `db`) define límites de recursos (`deploy.resources.limits`). | Medio | Agregar `deploy.resources.limits` por servicio. Por ejemplo: API → `cpus: '0.50'`, `memory: 512M`; Web → `cpus: '0.25'`, `memory: 256M`; DB → `cpus: '1.0'`, `memory: 1G`. Sin límites, un contenedor con un memory leak podría agotar los recursos del host y afectar a los demás servicios. |
| 5 | **Falta de healthchecks en API y Web, y falta de logging con rotación** | `docker-compose.yml` — el servicio `db` tiene healthcheck, pero `api` (línea 19-41) y `web` (línea 43-58) no tienen healthcheck configurado. Además, no hay configuración de logging driver con rotación de logs. | Medio | Agregar `healthcheck` al servicio `api` (ej. `wget --spider http://localhost:3000/` o `curl -f http://localhost:3000/`) y al servicio `web`. Configurar el logging driver `json-file` con rotación: `logging: { driver: json-file, options: { max-size: "10m", max-file: "3" } }`. Esto previene que los logs crezcan indefinidamente en disco y permite que Docker Compose detecte y reinicie servicios caídos. |

### Observaciones adicionales

- **Caché de capas Docker mal aprovechado:** en `packages/web/Dockerfile`, el `COPY . .` (línea 11) se hace justo después del `npm install` (línea 8), lo cual está correcto, pero falta copiar el `package-lock.json` del workspace raíz y no se usa `npm ci` (instalación determinista). Usar `npm ci` en lugar de `npm install` garantiza builds reproducibles.
- **Red por defecto (bridge):** el `docker-compose.yml` no define una red personalizada, por lo que todos los contenedores comparten la red bridge por defecto. En producción es recomendable definir una red interna dedicada para aislar el tráfico entre servicios.
- **Montura de volúmenes en desarrollo expuesta:** las líneas `volumes: - .:/app` montan todo el código fuente del host al contenedor, lo cual es correcto para desarrollo pero no debería existir en producción. El compose de producción no debería usar bind mounts del código.
