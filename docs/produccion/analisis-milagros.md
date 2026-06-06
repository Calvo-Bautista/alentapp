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