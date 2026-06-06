# Análisis de Infraestructura y Observabilidad

## 1. Análisis de Infraestructura Docker Actual

A continuación se presentan 5 problemas identificados en la configuración de Docker y Docker Compose para el proyecto Alentapp, orientados a mejorar la robustez, seguridad y eficiencia en un entorno de producción.

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
| :--- | :--- | :--- | :--- |
| **Ejecución como usuario root** | `packages/api/Dockerfile` y `packages/web/Dockerfile` (Implícito) | Alto | Utilizar la instrucción `USER node` en los Dockerfiles. Por defecto, las imágenes de Node.js corren como root, lo que permite a un atacante que comprometa el proceso tener acceso total al contenedor. |
| **Ausencia de límites de recursos (CPU/RAM)** | `docker-compose.yml` (sección `services`) | Medio | Definir `deploy.resources.limits` para cada servicio. Sin límites, un leak de memoria o un proceso pesado en un contenedor puede agotar los recursos del host y afectar a los demás servicios (OOM Killer). |
| **Exposición de secretos en texto plano** | `docker-compose.yml`| Alto | Utilizar variables de entorno inyectadas desde un archivo `.env` externo no trackeado o, preferiblemente, Docker Secrets. Nunca se deben dejar contraseñas como `password123` hardcodeadas en el repositorio. |
| **Ausencia de políticas de reinicio (restart policy)** | `docker-compose.yml` | Medio | Agregar `restart: unless-stopped` a los servicios. Sin esto, si un contenedor falla o el servidor se reinicia, los servicios no volverán a levantarse automáticamente, afectando la disponibilidad. |
| **Falta de Healthchecks en aplicaciones** | `docker-compose.yml` (servicios `api` y `web`) | Bajo | Implementar la instrucción `healthcheck` en el Compose para los servicios de aplicación. Esto permite que el orquestador sepa si la app realmente está respondiendo peticiones y no solo si el proceso está vivo. |

---

## 2. Investigación OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?
**OpenTelemetry** es un framework de observabilidad de código abierto y un estándar de la industria que proporciona un conjunto unificado de APIs, bibliotecas y agentes para recolectar telemetría (trazas, métricas y logs). 

La principal diferencia es que **OpenTelemetry es un estándar de recolección y exportación**, mientras que **Prometheus es un sistema de monitoreo completo** que incluye su propia base de datos de series temporales, lenguaje de consulta (PromQL) y sistema de alertas. OpenTelemetry no almacena datos; su función es capturarlos y enviarlos a backends como Prometheus, Jaeger o Tempo.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?
Los tres pilares son:
1.  **Logs:** Registros de eventos discretos con marca de tiempo.
2.  **Métricas:** Datos agregados y numéricos sobre el sistema a lo largo del tiempo.
3.  **Trazas:** El recorrido de una solicitud a través de los distintos microservicios.

**OpenTelemetry aborda los tres pilares**, ofreciendo una solución integral para capturar trazas, métricas y logs de forma correlacionada.

### Métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?
El método RED se utiliza para monitorear servicios orientados a solicitudes (APIs):
*   **Rate (Tasa):** La cantidad de solicitudes por segundo que recibe el servicio. Sirve para medir el tráfico y la demanda.
*   **Errors (Errores):** La cantidad de solicitudes que fallan (ej. HTTP 500). Sirve para medir la salud y disponibilidad del servicio.
*   **Duration (Duración/Latencia):** El tiempo que tarda el servicio en procesar las solicitudes. Sirve para medir el rendimiento y la experiencia del usuario.

### ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?
**OTLP** es el protocolo de comunicación nativo de OpenTelemetry para el intercambio de datos de telemetría entre clientes (SDKs) y recolectores.

La principal ventaja frente a exportar directamente a Prometheus es la **neutralidad de proveedor**. OTLP permite enviar trazas, métricas y logs simultáneamente a través de un único flujo optimizado. Además, permite usar un "OpenTelemetry Collector" intermedio que puede procesar, filtrar y enviar los mismos datos a múltiples destinos (ej. enviar métricas a Prometheus y trazas a Jaeger) sin cambiar el código de la aplicación.

### ¿Cómo se relaciona OpenTelemetry con Grafana?
OpenTelemetry y Grafana son complementarios. OpenTelemetry se encarga de la **generación y transporte** de los datos de observabilidad desde las aplicaciones, mientras que Grafana es la **plataforma de visualización**. Grafana se conecta a los backends de almacenamiento para crear dashboards que permiten analizar visualmente la salud y el rendimiento del sistema.
