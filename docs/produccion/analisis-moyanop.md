# Fase 1: Analizar y proponer

**Autor:** moyanop (Pedro Moyano) **Actividad:** TP Integrador - Actividad 4, Fase 1

## 1.1. Analizar la infraestructura Docker actual

A partir de la revisión de la configuración existente en los archivos `docker-compose.yml`, `packages/api/Dockerfile` y `packages/web/Dockerfile`, se identificaron los siguientes 5 problemas o vulnerabilidades respecto a las buenas prácticas de producción:

| Problema                                                              | ¿Dónde ocurre?                                                                          | Impacto | Solución propuesta                                                                                                                                                |
| :-------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tamaño de imagen y dependencias innecesarias** (Single-stage build) | `packages/api/Dockerfile` y `packages/web/Dockerfile`                                   | Alto    | Implementar Multi-stage builds (ej. separando etapas de dependencias, compilación y runtime) para excluir herramientas de desarrollo del contenedor final.        |
| **Ejecución con privilegios máximos (root) y permisos de escritura**  | Ambos `Dockerfile` (falta `USER node`) y `docker-compose.yml` (falta `read_only: true`) | Alto    | Asignar un usuario sin privilegios (ej. `USER node`) en la etapa final de los Dockerfiles y montar sistemas de archivos en modo lectura en producción.            |
| **Variables de entorno sensibles expuestas (Hardcoding)**             | `docker-compose.yml` (Variables `DATABASE_URL` y credenciales de PostgreSQL)            | Alto    | Mover todas las credenciales a un archivo `.env` externo (ignorado en Git) y referenciar usando `${VAR}` en el compose.                                           |
| **Falta de límites en el consumo de recursos**                        | `docker-compose.yml` (servicios `api` y `web`)                                          | Medio   | Establecer topes mediante `deploy.resources.limits` (CPU y memoria) para prevenir que un contenedor agote los recursos del host.                                  |
| **Ausencia de monitoreo de estado funcional (Healthchecks)**          | `docker-compose.yml` (servicio `api`)                                                   | Medio   | Implementar directivas `healthcheck` (por ejemplo, con `wget` o `curl` a un endpoint `/health`) para verificar que la aplicación esté lista para recibir tráfico. |

## 1.2. Investigar OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

OpenTelemetry (OTel) es un estándar abierto y un conjunto de herramientas diseñado para instrumentar, generar, recolectar y exportar datos de telemetría de forma independiente del proveedor (vendor-neutral). Se diferencia de Prometheus en que OTel se encarga de la _recolección y exportación_ de la información, mientras que Prometheus actúa como el _backend o base de datos_ que almacena y permite consultar esas métricas.

### Los 3 pilares de la observabilidad

Los 3 pilares son:

- **Métricas (Metrics):** valores numericos agregados que describen el estado del sistema en un momento dado (ej. cantidad de request por segundo, uso de memoria).
- **Trazas (Traces):** registran el recorrido completo de una request a traves de los distintos servicios de un siostema distribuido.
- **Registros (Logs):** registro cronológico de eventos discretos que ocurren dentro de un componente (un usuario inició sesión, se creó un pago nuevo, falló la validación de un pago, etc.).
  OpenTelemetry aborda los tres pilares, unificándolos en un único estándar de instrumentación
  y exportación.

### Métricas RED (Rate, Errors, Duration)

El metodo RED, definido por Tom Wilkie (Grafana Labs), propone monitoriar tres metricas para cada servicio:

- **Rate (Tasa):** Es el número de peticiones por segundo. Sirve para medir el volumen de tráfico actual y entender la carga que está soportando el sistema.
- **Errors (Errores):** Es la tasa de peticiones fallidas (ej. respuestas 5xx). Sirve para monitorizar la fiabilidad, alertando si el sistema experimenta fallos o degradación.
- **Duration (Duración o Latencia):** Es el tiempo de respuesta del sistema. Sirve para evaluar el rendimiento general y garantizar una experiencia de usuario fluida.

### ¿Qué es OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

OTLP es el protocolo oficial mediante el cual OpenTelemetry emite sus datos de telemetría. Su principal ventaja es que al ser un estándar universal, permite enviar los datos a un "Collector" intermedio que luego puede redirigirlos a cualquier sistema (Prometheus, Datadog, Jaeger, etc.) sin necesidad de reescribir la instrumentación en el código fuente de la aplicación si en un futuro se cambia de proveedor.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

OpenTelemetry actúa como los "sensores" en la aplicación recolectando datos (como métricas RED) y enviándolos hacia Prometheus. **Grafana**, siendo la capa visual, se conecta directamente a Prometheus para leer esa información almacenada y crear **dashboards visuales**, permitiendo a los desarrolladores diagnosticar el estado del sistema mediante gráficos y paneles interactivos.
