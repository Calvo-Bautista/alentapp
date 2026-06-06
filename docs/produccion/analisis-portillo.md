# Análisis de Infraestructura para Producción

**Autor:** portillo (Franco Portillo)
**Actividad:** TP Integrador - Actividad 4, Fase 1

---

## 1. Analizar la infraestructura Docker actual

Se revisaron los archivos `docker-compose.yml`, `packages/api/Dockerfile` y `packages/web/Dockerfile` del proyecto. A continuación se documentan 5 problemas o vulnerabilidades identificados respecto a buenas prácticas de producción.

| # | Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|----------|----------------|---------|-------------------|
| 1 | **Imagen base pesada, single-stage build y frontend en modo desarrollo** | `packages/api/Dockerfile:1` y `packages/web/Dockerfile:1` — usan `node:20-alpine` como única etapa, instalando dependencias de dev y compilación en la imagen final. En `packages/web/Dockerfile:17` se utiliza `npm run dev` para levantar el frontend con el servidor de desarrollo de Vite (HMR y código sin minificar). | Alto | Implementar multi-stage builds con 3 etapas: `deps`, `build` y `runtime`. Para la API, dejar solo la compilación JS + node_modules de prod. Para el frontend, compilar con `npm run build` y servir los archivos estáticos usando `nginx:stable-alpine`. Esto reduce drásticamente el tamaño y mejora el rendimiento y seguridad de producción al no usar el servidor de desarrollo de Vite. |
| 2 | **Ejecución como usuario root y filesystem de lectura-escritura** | `packages/api/Dockerfile` y `packages/web/Dockerfile` — no definen `USER` no-root. `docker-compose.yml` — no utiliza `read_only: true`, `cap_drop: ALL`, ni `security_opt: no-new-privileges`. | Alto | Agregar `USER node` (o crear un `appuser`) en la etapa final del Dockerfile. En el compose de producción, configurar `read_only: true`, `cap_drop: ALL`, `cap_add: [NET_BIND_SERVICE]` y `security_opt: [no-new-privileges]`. Esto sigue el principio de mínimo privilegio y limita el impacto de una posible vulnerabilidad. |
| 3 | **Credenciales hardcodeadas en docker-compose.yml** | `docker-compose.yml:6-8` — `POSTGRES_USER: admin`, `POSTGRES_PASSWORD: password123`, `POSTGRES_DB: alentapp_db` están directamente en el archivo. Línea 30: `DATABASE_URL=postgres://admin:password123@db:5432/alentapp_db` expone la contraseña en texto plano. | Alto | Extraer todas las credenciales a un archivo `.env` externo (ignorado por `.gitignore`) y referenciarlas con `${VARIABLE}` en el compose. Ejemplo: `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}`. También evaluar el uso de Docker Secrets para producción. |
| 4 | **Ausencia de resource limits (CPU/memoria)** | `docker-compose.yml` — ninguno de los servicios (`api`, `web`, `db`) define límites de recursos (`deploy.resources.limits`). | Medio | Agregar `deploy.resources.limits` por servicio. Por ejemplo: API → `cpus: '0.50'`, `memory: 512M`; Web → `cpus: '0.25'`, `memory: 256M`; DB → `cpus: '1.0'`, `memory: 1G`. Sin límites, un contenedor con un memory leak podría agotar los recursos del host y afectar a los demás servicios. |
| 5 | **Falta de healthchecks, políticas de reinicio y rotación de logs** | `docker-compose.yml` — los servicios `api` y `web` no tienen healthcheck ni políticas de reinicio (`restart`). Además, no hay configuración de logging driver con rotación de logs. | Medio | Agregar `healthcheck` y `restart: unless-stopped` a los servicios `api` y `web` (y asegurar políticas adecuadas en la BD). Configurar el logging driver `json-file` con rotación: `logging: { driver: json-file, options: { max-size: "10m", max-file: "3" } }`. Esto asegura disponibilidad automática tras caídas o reboots, detecta fallas funcionales y previene que los logs llenen el disco. |

### Observaciones adicionales

- **Caché de capas Docker mal aprovechado:** en `packages/web/Dockerfile`, el `COPY . .` (línea 11) se hace justo después del `npm install` (línea 8), lo cual está correcto, pero falta copiar el `package-lock.json` del workspace raíz y no se usa `npm ci` (instalación determinista). Usar `npm ci` en lugar de `npm install` garantiza builds reproducibles.
- **Red por defecto (bridge):** el `docker-compose.yml` no define una red personalizada, por lo que todos los contenedores comparten la red bridge por defecto. En producción es recomendable definir una red interna dedicada para aislar el tráfico entre servicios.
- **Montura de volúmenes en desarrollo expuesta:** las líneas `volumes: - .:/app` montan todo el código fuente del host al contenedor, lo cual es correcto para desarrollo pero no debería existir en producción. El compose de producción no debería usar bind mounts del código.

---

## 2. Investigar OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un framework y estándar abierto (parte de la Cloud Native Computing Foundation) diseñado para **instrumentar, generar, recolectar y exportar** datos de telemetría (métricas, trazas y logs) de forma agnóstica al proveedor (*vendor-neutral*). Proporciona SDKs y APIs para diversos lenguajes que permiten al desarrollador instrumentar su aplicación una sola vez.

**Prometheus**, en cambio, es un **sistema de monitoreo y base de datos de series temporales** (*time-series database*). Se encarga de **almacenar, consultar y alertar** sobre métricas.

La diferencia clave es su rol en el pipeline de observabilidad:
- **OpenTelemetry** = **genera y exporta** los datos de telemetría (es el *productor*).
- **Prometheus** = **almacena y consulta** las métricas (es el *consumidor/backend*).

Ambos son complementarios: OTel instrumenta la aplicación y expone las métricas, mientras que Prometheus las scrapea y almacena para su posterior consulta y alerting.

### Los 3 pilares de la observabilidad

Los tres pilares de la observabilidad son:

1. **Métricas (Metrics):** Son valores numéricos agregados que describen el estado del sistema en un momento dado. Ejemplos: cantidad de requests por segundo, porcentaje de uso de CPU, memoria consumida. Son ligeras y eficientes para monitoreo en tiempo real y alertas.

2. **Trazas (Traces):** Registran el recorrido completo de una petición a través de los distintos componentes o servicios de un sistema distribuido. Cada traza se compone de *spans* (segmentos) que representan operaciones individuales. Son fundamentales para diagnosticar problemas de latencia y entender dependencias entre servicios.

3. **Logs (Registros):** Son registros cronológicos de eventos discretos que ocurren dentro de un componente. Proporcionan contexto detallado sobre qué sucedió en un momento específico (ej: "usuario X inició sesión", "falló la validación del pago Y con error Z").

**OpenTelemetry aborda los tres pilares**, unificándolos bajo un único estándar de instrumentación y exportación. Esto permite correlacionar métricas, trazas y logs entre sí para obtener una visión integral del sistema.

### Métricas RED (Rate, Errors, Duration)

El método RED, definido por Tom Wilkie (Grafana Labs), propone monitorear tres métricas fundamentales para cada servicio orientado a requests:

- **Rate (Tasa):** Es el número de peticiones por segundo que recibe el servicio. Sirve para medir el **volumen de tráfico** actual, entender la carga que soporta el sistema y detectar picos o caídas anormales de tráfico.

- **Errors (Errores):** Es la tasa de peticiones que resultan en error (típicamente respuestas HTTP 4xx/5xx). Sirve para monitorear la **fiabilidad** del servicio, alertando inmediatamente si se produce una degradación o si el sistema comienza a fallar.

- **Duration (Duración/Latencia):** Es el tiempo que tarda cada petición en ser procesada, usualmente medido como histograma con percentiles (p50, p95, p99). Sirve para evaluar el **rendimiento percibido** por el usuario y detectar cuellos de botella o degradaciones de performance.

Estas tres métricas juntas dan una visión completa de la salud de un servicio desde la perspectiva del usuario final.

### ¿Qué es OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

**OTLP (OpenTelemetry Protocol)** es el protocolo nativo y oficial de OpenTelemetry para transmitir datos de telemetría. Soporta el envío de métricas, trazas y logs en un formato unificado, utilizando transporte gRPC o HTTP/protobuf.

**Ventajas frente a exportar directamente a Prometheus:**

1. **Vendor-neutral (agnóstico al proveedor):** Con OTLP, la aplicación envía datos a un *Collector* intermedio que puede reenviarlos a cualquier backend (Prometheus, Datadog, Jaeger, Grafana Cloud, etc.). Si en el futuro se decide cambiar de proveedor, no es necesario modificar la instrumentación en el código.

2. **Push vs Pull:** OTLP usa un modelo *push* (la aplicación envía activamente las métricas), mientras que Prometheus usa *pull* (el servidor scrapea periódicamente). El modelo push es más adecuado para entornos efímeros (containers, serverless) donde los procesos pueden desaparecer antes de ser scrapeados.

3. **Unificación de señales:** OTLP transporta métricas, trazas y logs en un mismo protocolo, facilitando la correlación entre ellos. Prometheus solo maneja métricas.

4. **Procesamiento intermedio:** El OpenTelemetry Collector permite filtrar, transformar y enrutar datos antes de enviarlos al backend, reduciendo el volumen de datos almacenados y los costos asociados.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

OpenTelemetry y Grafana cumplen roles complementarios en el pipeline de observabilidad:

1. **OpenTelemetry** actúa como la capa de **instrumentación y recolección**: se integra en la aplicación (en nuestro caso, la API Fastify), captura las métricas RED, trazas y logs, y los exporta hacia un backend de almacenamiento.

2. **Prometheus** (u otro backend compatible) **almacena** las métricas que OpenTelemetry exporta, actuando como la base de datos de series temporales.

3. **Grafana** es la capa de **visualización y dashboarding**: se conecta a Prometheus como *datasource*, lee las métricas almacenadas y permite crear dashboards interactivos con gráficos, alertas y paneles en tiempo real.

El flujo completo sería:
```
App (instrumentada con OTel SDK) → exporta métricas → Prometheus (almacena) → Grafana (visualiza)
```

En nuestro caso específico, la API de Alentapp usaría el SDK de OpenTelemetry para Node.js con el `PrometheusExporter`, exponiendo un endpoint `/metrics` en el puerto 9464. Prometheus scrapearía ese endpoint periódicamente, y Grafana consultaría Prometheus para mostrar los dashboards RED con los 6 paneles definidos en la consigna.
