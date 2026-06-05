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
