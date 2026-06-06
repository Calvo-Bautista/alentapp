# 1.1. Análisis de la infraestructura Docker actual

Se analizaron los siguientes archivos para esta entrega:

* `docker-compose.yml`
* `packages/api/Dockerfile`
* `packages/web/Dockerfile`

El objetivo planteado fue detectar problemas o vulnerabilidades del proyecto en los archivos de Docker, ya que si bien cumple con las entregas anteriores, le faltan algunos detalles de seguridad que dejan a los contenedores en varios aspectos, vulnerables. Se detallan a continuación 5 problemas encontrados:

## Problemas detectados

| Problema                                                                                   | ¿Dónde ocurre?                                                                                                                                                                                        | Impacto | Solución propuesta                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credenciales sensibles hardcodeadas                                                        | `docker-compose.yml`, servicio `db`, variables `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`; y servicio `api`, variable `DATABASE_URL`                                                         | Alto    | Mover las credenciales a un archivo `.env` y referenciarlas desde `docker-compose.yml`. Por ejemplo, usar `${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`, `${POSTGRES_DB}` y `${DATABASE_URL}`. Esto evita exponer datos sensibles dentro del repositorio.                              |
| No existe separación clara entre desarrollo y producción                                   | `docker-compose.yml`, servicios `api` y `web`. La API ejecuta `prisma migrate dev`, `prisma generate` y `tsx watch`; el frontend ejecuta `npm run dev` con Vite                                       | Alto    | Crear un archivo separado `docker-compose.prod.yml` para producción. En producción la API debería ejecutar código JavaScript ya compilado y el frontend debería servirse con nginx, no con el servidor de desarrollo de Vite.                                                       |
| Las imágenes no usan multi-stage build y conservan dependencias/herramientas de desarrollo | `packages/api/Dockerfile` y `packages/web/Dockerfile`. Ambos instalan dependencias con `npm install` y copian todo el proyecto con `COPY . .`                                                         | Alto    | Crear `Dockerfile.prod` para API y Web usando multi-stage builds. Para la API, separar etapas de dependencias, build y runtime. Para la Web, compilar con Vite en una etapa y servir los archivos estáticos con nginx en la etapa final. Esto reduce tamaño y superficie de ataque. |
| Los contenedores corren con permisos por defecto (root)                  | `packages/api/Dockerfile` y `packages/web/Dockerfile`. No se define ningún usuario con `USER`. En `docker-compose.yml` tampoco se aplican restricciones como `read_only`, `cap_drop` o `security_opt` | Alto    | Definir un usuario no-root en las imágenes finales, por ejemplo `USER node`. En producción agregar medidas como `read_only: true`, `cap_drop: ALL` y `security_opt: ["no-new-privileges:true"]`. Aplica el principio de menor privilegio.                     |
| No hay healthchecks                                    | `docker-compose.yml`. Solo la base de datos tiene `healthcheck`; la API y el frontend no tienen verificación de salud.                  | Medio   | Agregar healthchecks para API y Web. Por ejemplo, la API podría validar `localhost:3000/health` y el frontend `localhost:80`.            |

# 1.2. Investigación sobre OpenTelemetry

## ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

OpenTelemetry es un framework open source que permite instrumentar aplicaciones para generar, recolectar y exportar datos de telemetría. Estos datos pueden ser métricas, logs y trazas, y sirven para entender el comportamiento interno de una aplicación en ejecución.

En el contexto del proyecto de la materia, OpenTelemetry se utiliza para instrumentar la API Node.js/Fastify y obtener métricas relacionadas con las requests HTTP, como cantidad de solicitudes, errores y duración de las respuestas.

Prometheus en cambio no instrumenta directamente la aplicación. Prometheus es una herramienta de monitoreo que recolecta métricas desde endpoints HTTP, normalmente endpoints `/metrics`, mediante un mecanismo llamado scraping. Es decir, Prometheus consulta periódicamente un endpoint expuesto por la aplicación y guarda esas métricas en una base de datos de series temporales.

La diferencia principal es que OpenTelemetry se encarga de generar y exportar la telemetría desde la aplicación, mientras que Prometheus se encarga de recolectar, almacenar y consultar métricas.

Flujo conceptual:

```txt
Aplicación Node.js/Fastify
        ↓
OpenTelemetry instrumenta la aplicación
        ↓
Prometheus Exporter expone /metrics
        ↓
Prometheus scrapea y almacena las métricas
        ↓
Grafana visualiza los datos en dashboards
```

---

## ¿Cuáles son los tres pilares de la observabilidad? ¿Cuál aborda OpenTelemetry?

Los tres pilares de la observabilidad son:

| Pilar    | Descripción                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Métricas | Valores numéricos medidos en el tiempo. Permiten analizar rendimiento, uso de recursos, cantidad de requests, errores, o latencia entre otros.             |
| Logs     | Registros de eventos que ocurren dentro del sistema. Sirven para entender qué pasó en un momento determinado.                                     |
| Trazas   | Representan el recorrido de una request a través de uno o varios servicios. |

OpenTelemetry aborda los tres pilares porque permite trabajar con métricas, logs y trazas. Sin embargo esta entrega tiene el foco principalen las métricas, especialmente en las métricas RED para monitorear el comportamiento de la API.

En Alentapp, OpenTelemetry se utilizará principalmente para capturar datos como:

* Cantidad total de requests HTTP.
* Cantidad de errores HTTP.
* Duración de las requests.
* Uso de memoria del proceso.

Esto permite observar el estado de la API durante su ejecución y detectar problemas de rendimiento o estabilidad.

---

## Métricas RED: Rate, Errors, Duration

El método RED es una forma de monitorear servicios, especialmente APIs y microservicios. RED significa:

```txt
R = Rate
E = Errors
D = Duration
```

Estas tres métricas permiten conocer el comportamiento externo de un servicio desde el punto de vista de quienes lo consumen.

| Métrica  | ¿Qué mide?                                  | ¿Para qué sirve?                                                                         |
| -------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Rate     | Cantidad de requests por segundo            | Permite saber cuánto tráfico está recibiendo la API.                                     |
| Errors   | Cantidad o porcentaje de requests fallidas  | Permite detectar fallos en endpoints, errores 4xx/5xx o problemas internos del servicio. |
| Duration | Tiempo que tarda una request en completarse | Permite analizar la latencia y detectar endpoints lentos.                                |

---

## ¿Qué es OTLP? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

OTLP significa OpenTelemetry Protocol. Es el protocolo estándar utilizado por OpenTelemetry para transportar datos de telemetría, como métricas, logs y trazas.

Su objetivo es permitir que las aplicaciones exporten datos en un formato común, independientemente de la herramienta que luego se use para almacenarlos o visualizarlos.

La ventaja de OTLP frente a exportar directamente a Prometheus es el desacoplamiento. Si una aplicación exporta únicamente en formato Prometheus, queda más ligada a ese ecosistema. En cambio, si exporta mediante OTLP, puede enviar los datos a un OpenTelemetry Collector y desde ahí redirigirlos a distintos backends, como Prometheus, Grafana, Tempo, Loki u otras plataformas de observabilidad.

Flujo con exportación directa a Prometheus:

```txt
Aplicación
   ↓
Prometheus Exporter
   ↓
Prometheus
```

Flujo usando OTLP y Collector:

```txt
Aplicación
   ↓
OTLP
   ↓
OpenTelemetry Collector
   ↓
Prometheus / Grafana / Tempo / Loki
```


---

## ¿Cómo se relaciona OpenTelemetry con Grafana?

OpenTelemetry y Grafana cumplen roles diferentes dentro de la observabilidad.

OpenTelemetry se encarga de generar, recolectar y exportar datos de telemetría desde la aplicación. Grafana, por su parte, se encarga de visualizar esos datos mediante dashboards, gráficos y paneles.

En el caso de esta actividad, la relación es la siguiente:

```txt
API Alentapp
   ↓
OpenTelemetry genera métricas RED
   ↓
Prometheus recolecta las métricas desde /metrics
   ↓
Grafana consulta Prometheus como datasource
   ↓
Dashboard RED muestra tráfico, errores y latencia
```

Grafana no reemplaza a OpenTelemetry. Grafana necesita una fuente de datos, como Prometheus, para poder mostrar gráficos. OpenTelemetry ayuda a que esos datos existan y estén disponibles de forma estandarizada. OpenTelemetry permite instrumentar la API, Prometheus recolecta las métricas y Grafana las presenta visualmente para facilitar el análisis del estado del sistema.

