# Fase 1 – Análisis y propuesta

**Alumno:** Franco Jiménez
**Materia:** Ingeniería y Calidad de Software – 2026
**TP Integrador – Actividad 4: Preparando para Producción**

Para esta primera parte me puse a leer la configuración de Docker que tenemos hoy
en el repo (`docker-compose.yml`, `packages/api/Dockerfile` y `packages/web/Dockerfile`).
La idea fue mirarla pensando "esto mañana corre en un servidor de verdad" y ahí
empiezan a saltar varias cosas. La config que tenemos está bastante bien para
desarrollo (hot reload, todo montado, levanta rápido), pero justamente por eso no
sirve tal cual para producción. Abajo dejo los 5 problemas que me parecieron más
importantes y después la parte de OpenTelemetry.

## 1.1 Problemas en la infraestructura Docker actual

| # | Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|----------|----------------|---------|--------------------|
| 1 | Los contenedores corren como `root` | `packages/api/Dockerfile` y `packages/web/Dockerfile` (no hay ninguna instrucción `USER`) | Alto | Crear un usuario sin privilegios y declararlo con `USER` antes del `CMD` |
| 2 | Imagen single-stage que se lleva todo: devDependencies + herramientas de build | `packages/api/Dockerfile:12` (`npm install`) y `packages/web/Dockerfile:8` | Alto | Multi-stage build, `npm ci --omit=dev` y dejar en la imagen final solo el código compilado + deps de producción |
| 3 | Credenciales hardcodeadas en el compose | `docker-compose.yml:6-8` (user/pass/DB) y `docker-compose.yml:30` (password dentro del `DATABASE_URL`) | Alto | Pasar las variables sensibles por un archivo `.env` no versionado y referenciarlas con `${VAR}` |
| 4 | API y Web sin healthcheck ni límites de recursos | `docker-compose.yml`, servicios `api` (líneas 19-41) y `web` (43-60) | Medio | Agregar `healthcheck` a cada servicio y límites de CPU/memoria |
| 5 | El frontend se sirve con el dev server de Vite | `packages/web/Dockerfile:17` (`npm run dev`) | Alto | Hacer `vite build` y servir los archivos estáticos con nginx |

### Por qué cada uno me parece un problema

**1) Correr como root.** Ninguno de los dos Dockerfile cambia de usuario, así que el
proceso de Node arranca como root dentro del contenedor. Si alguien logra meterse por
algún agujero de la app, ya está adentro con el usuario más privilegiado, y si encima
el contenedor tiene algún mal seteo, eso se puede escalar al host. Es de las primeras
cosas que recomiendan sacar en cualquier guía de seguridad de Docker. La solución es
simple: crear un usuario común (por ejemplo `appuser`, o usar el `node` que ya viene en
la imagen) y poner `USER` antes de levantar la app.

**2) Imagen demasiado grande.** En `packages/api/Dockerfile:12` se hace `npm install`,
que instala **todo**, incluidas las devDependencies (tsx, prisma, vitest, etc.) y además
nunca se compila: la app se ejecuta directo con `tsx watch`. Eso significa que en la
imagen "de producción" terminan quedando herramientas de build y testing que no se usan
para correr la app. El problema es doble: pesa muchísimo más de lo necesario (más tiempo
de pull, más disco) y aumenta la superficie de ataque (cuantas más cosas tenés instaladas,
más posibles vulnerabilidades). La idea es separar en etapas: una para instalar/compilar y
otra final que solo se quede con lo justo para correr.

**3) Credenciales a la vista.** En `docker-compose.yml:6-8` están el usuario, la contraseña
y el nombre de la base escritos en texto plano, y en la línea 30 la misma contraseña viaja
dentro del `DATABASE_URL`. Como el `docker-compose.yml` se versiona en git, esas credenciales
quedan en el historial del repo para siempre. En desarrollo no es grave, pero en producción
no podés tener la contraseña de la base commiteada. Lo correcto es sacarlas a un `.env` que
esté en el `.gitignore` y referenciarlas con `${POSTGRES_PASSWORD}`, etc.

**4) Sin healthchecks ni límites en API y Web.** La base de datos sí tiene un `healthcheck`
(`docker-compose.yml:13-17`), pero la API y el frontend no tienen ninguno, así que Docker no
tiene forma de saber si el servicio está realmente "sano" o se quedó colgado: lo ve "up"
aunque adentro esté roto. Tampoco hay límites de CPU ni memoria, o sea que un servicio que
se descontrola (un leak, por ejemplo) se puede comer todos los recursos de la máquina y
tirar abajo al resto. La solución es agregar un `healthcheck` por servicio (la API ya
responde en `/`, así que se puede pegar ahí) y poner límites de recursos.

**5) Frontend servido con Vite en modo dev.** En `packages/web/Dockerfile:17` el contenedor
levanta `npm run dev`, que es el dev server de Vite. Ese server está pensado para desarrollar:
sirve los módulos sin optimizar, deja el HMR (hot reload) prendido y no está hecho para
aguantar tráfico real. Para producción lo que se hace es compilar con `vite build` (que genera
HTML/CSS/JS estáticos y minificados) y servir esos archivos con un servidor pensado para eso,
como nginx, que además es mucho más liviano y rápido para servir estáticos.

> Mientras revisaba también vi otras cosas que apuntan en la misma dirección y que conviene
> arreglar para producción: el `.dockerignore` es muy básico, no hay separación entre un
> compose de dev y uno de prod, y el bind-mount `.:/app` del compose monta todo el código
> del host adentro del contenedor (algo muy de desarrollo). No las cuento dentro de los 5
> principales, pero las dejo anotadas porque van en la misma línea.

## 1.2 Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y en qué se diferencia de Prometheus?

OpenTelemetry (OTel para abreviar) es un estándar y un conjunto de herramientas para
**generar y exportar telemetría** desde una aplicación: trazas, métricas y logs. Lo
importante es que es agnóstico del backend, o sea que vos instrumentás tu código una sola
vez y después podés mandar esos datos a donde quieras. OTel **no guarda ni muestra** los
datos, solo se encarga de producirlos y transportarlos.

Prometheus, en cambio, es un **sistema de monitoreo**: tiene su propia base de datos de
series temporales donde almacena las métricas, las va a buscar él mismo a los servicios
(modelo *pull*: scrapea un endpoint `/metrics` cada X segundos) y trae un lenguaje de
consultas, PromQL.

La diferencia en una frase: **OTel es el "cómo genero y mando" la telemetría, Prometheus
es el "dónde la guardo y la consulto"**. De hecho no compiten, se complementan: en este TP
OTel genera las métricas y las expone, y Prometheus las recolecta y las guarda.

### Los "3 pilares" de la observabilidad

Los tres pilares clásicos son:

- **Logs:** registros de eventos puntuales ("pasó esto a tal hora"). Sirven para el detalle.
- **Métricas:** valores numéricos agregados en el tiempo (requests por segundo, uso de memoria,
  latencia). Sirven para ver tendencias y armar alertas.
- **Trazas (traces):** el camino completo de un request a través del sistema, útil sobre todo
  en arquitecturas distribuidas para ver dónde se va el tiempo.

OpenTelemetry abarca **los tres** (por eso se dice que es "señal-agnóstico"), aunque en este
trabajo lo vamos a usar puntualmente para el pilar de **métricas**.

### Métricas RED (Rate, Errors, Duration)

El método RED lo propuso Tom Wilkie y está pensado para monitorear servicios que atienden
requests (como nuestra API). Son tres métricas:

- **Rate (tasa):** cuántos requests por segundo está recibiendo el servicio. Te dice cuánta
  carga/tráfico tiene en este momento.
- **Errors (errores):** cuántos de esos requests fallan (típicamente los 4xx y 5xx). Te dice
  si la cosa está funcionando bien o si algo se rompió.
- **Duration (duración):** cuánto tardan los requests en responder (la latencia, mirada como
  distribución: p95, p99). Te dice qué tan rápida la siente el usuario.

La gracia es que con esas tres preguntas —¿cuánto tráfico tengo?, ¿cuántos errores?, ¿qué tan
rápido respondo?— ya tenés una foto bastante completa de la salud de un servicio. Es el
equivalente "para servicios" del método USE (que apunta más a recursos como CPU o disco).

### ¿Qué es OTLP y qué ventaja tiene sobre exportar directo a Prometheus?

OTLP es el **OpenTelemetry Protocol**, el protocolo estándar de OTel para transportar la
telemetría (anda sobre gRPC o HTTP). Es el formato común que hablan el SDK, el Collector y
los distintos backends.

La ventaja principal frente a exportar directo en formato Prometheus es el
**desacople**: si tu app habla OTLP, no queda atada a una herramienta puntual. Hoy mandás las
métricas a Prometheus, mañana querés mandarlas a otro backend (o agregar trazas y logs por el
mismo camino) y no tenés que tocar el código de la app, solo cambiás la configuración del
exporter o del Collector. Además es un único formato para las tres señales (métricas, trazas y
logs) y es vendor-neutral. Cuando exportás directo en formato Prometheus quedás pegado a su
modelo *pull* y a su formato particular.

(Aclaración honesta: en la implementación de este TP usamos el `PrometheusExporter`, que expone
un `/metrics` para que Prometheus lo scrapee, así que ahí no estamos usando OTLP puro. Igual la
ventaja conceptual de OTLP es la del desacople que expliqué arriba.)

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Grafana es la capa de **visualización**: es donde armás los dashboards y los gráficos, pero por
sí solo no almacena las métricas. Para mostrar algo se conecta a un *datasource*, que en nuestro
caso es Prometheus.

El flujo completo queda así:

```
App (instrumentada con OpenTelemetry)  ->  Prometheus (recolecta y guarda)  ->  Grafana (visualiza)
```

Es decir: **OTel produce los datos, Prometheus los guarda, y Grafana los muestra.** Cada uno hace
su parte y juntos arman la cadena de observabilidad que vamos a montar en las próximas fases.
