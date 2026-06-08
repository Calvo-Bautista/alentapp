# Estrategia de Testing - Alentapp

Este documento detalla la infraestructura de testing implementada en el proyecto, cubriendo desde pruebas unitarias hasta tests End-to-End (E2E) Full-Stack.

## 🚀 Resumen de Comandos

### Tests Globales (Raíz)
| Comando | Descripción |
|---|---|
| `npm test` | Ejecuta los tests unitarios e integración de API y los tests Vitest de la web. |
| `npm run e2e:fullstack:run` | **Recomendado para CI**. Levanta Docker, corre tests full-stack y apaga todo. |
| `npm run e2e:fullstack:ui:run` | Levanta Docker y abre la interfaz interactiva de Playwright. |
| `npm run e2e:fullstack:headed:run` | Levanta Docker, corre tests con navegador visible y apaga todo. |
| `npm run e2e:fullstack:up` | Levanta el entorno Docker de pruebas (DB, API, Web). |
| `npm run e2e:fullstack:down` | Apaga el entorno Docker de pruebas y limpia volúmenes. |
| `npm run e2e:fullstack` | Ejecuta los tests E2E Full-Stack (requiere `up` previo). |
| `npm run e2e:fullstack:ui` | Abre la interfaz interactiva (requiere `up` previo). |
| `npm run e2e:fullstack:headed` | Ejecuta con navegador visible (requiere `up` previo). |

### Tests de Backend (`packages/api`)
> **Requisito previo**: antes de correr tests de integración o E2E de la API, generá el cliente de Prisma una vez:
> ```bash
> cd packages/api
> npx prisma generate
> ```
> Sin esto, los tests de integración y E2E fallan al importar la app con `Cannot find module '../generated/client'`.

| Comando | Descripción |
|---|---|
| `npm test -w packages/api` | Ejecuta tests unitarios e integración una sola vez, sin requerir PostgreSQL. |
| `npm run test:unit -w packages/api` | Ejecuta solamente los tests unitarios. |
| `npm run test:integration -w packages/api` | Ejecuta solamente los tests de integración con repositorios mockeados. |
| `npm run test:e2e -w packages/api` | Ejecuta los E2E de API contra PostgreSQL de pruebas en el puerto `5433`. |
| `npm run test:watch -w packages/api` | Ejecuta los tests unitarios en modo watch. |
| `npm run coverage -w packages/api` | Genera cobertura de los tests unitarios. |

Para ejecutar los E2E de API, primero levantá el entorno de pruebas y apagalo al terminar:

```bash
npm run e2e:fullstack:up
npm run test:e2e -w packages/api
npm run e2e:fullstack:down
```

### Tests de Frontend (`packages/web`)
| Comando | Descripción |
|---|---|
| `npm test -w packages/web` | Ejecuta tests unitarios e integración con Vitest. |
| `npm run coverage -w packages/web` | Genera reporte de cobertura de código del frontend. |
| `npm run e2e -w packages/web` | Ejecuta tests E2E **aislados** (con mocks de red). |

> Los tests E2E con Playwright (frontend y full-stack) requieren los navegadores instalados una única vez: `npx playwright install chromium`.

---

## 🛠 Niveles de Testing

### 1. Tests Unitarios e Integración de Backend (Vitest)
Ubicados en `packages/api/src/**/*.test.ts`.
*   **Unitarios** (`*.test.ts` en `domain/services` y `application`): validan validadores y casos de uso de forma aislada, mockeando los repositorios. No necesitan base de datos ni `prisma generate`.
*   **Integración** (`*.delivery/*.integration.test.ts`): levantan la app de Fastify completa (`buildApp`) con los repositorios mockeados, ejercitando el ciclo Controller → UseCase → Validator. No necesitan una DB corriendo, pero **sí requieren `prisma generate`** porque la app importa el cliente generado.
*   **E2E de API** (`*.delivery/*.e2e.test.ts`): levantan la app contra una **PostgreSQL real** y verifican la persistencia con Prisma. Cargan `packages/api/.env.test` y requieren el entorno Docker de pruebas levantado.

### 2. Tests Unitarios e Integración de Frontend (Vitest + RTL)
Ubicados en `packages/web/src/**/*.test.tsx`.
*   **Propósito**: Validar la lógica de componentes y hooks de forma aislada.
*   **Entorno**: JSDOM (simulación de navegador en Node).
*   **Mocks**: Se mockean los servicios de API para probar solo la UI.

### 3. E2E Frontend Aislado (Playwright + Mocks)
Ubicados en `packages/web/e2e/`.
*   **Propósito**: Probar flujos de usuario complejos sin depender de que la API real esté funcionando.
*   **Funcionamiento**: Playwright intercepta las llamadas `/api/v1/*` y devuelve respuestas predefinidas (Mocking Stateful).
*   **Ventaja**: Son extremadamente rápidos y deterministas.

### 4. E2E Full-Stack (Playwright + Docker)
Ubicados en `e2e-fullstack/`.
*   **Propósito**: Validar el flujo real desde el Navegador -> React -> API (Fastify) -> Base de Datos (PostgreSQL).
*   **Infraestructura**: Usa `docker-compose.e2e.yml` para levantar una base de datos de prueba aislada (`alentapp_test_db`).
*   **Limpieza Dinámica**: El script `global-setup.ts` detecta automáticamente todas las tablas del esquema público y las limpia una vez al iniciar la corrida, garantizando que los tests no dependan de basura de ejecuciones anteriores.

---

## 📂 Estructura de Archivos
*   `playwright.fullstack.config.ts`: Configuración para el entorno real.
*   `scripts/run-fullstack-e2e.mjs`: Levanta Docker, espera los tests y apaga el entorno preservando su código de salida.
*   `e2e-fullstack/global-setup.ts`: Orquestador que espera a la API y limpia la DB.
*   `packages/web/playwright.config.ts`: Configuración para el entorno con mocks.
*   `packages/api/.env.test`: Configuración de la API para el entorno de pruebas.
*   `packages/api/vitest.*.config.ts`: Configuraciones separadas para unitarios, integración y E2E de API.

## 💡 Buenas Prácticas
1.  **Aislamiento de Datos**: Nunca corras los tests E2E contra tu base de datos de desarrollo local. Usá siempre los scripts de Docker provistos.
2.  **Selectores**: Preferí `page.getByRole` o `page.getByText` antes que selectores CSS o IDs, para asegurar que los tests sean accesibles.
3.  **Mocks vs Real**: Usá los tests con mocks para desarrollo rápido de UI y los Full-Stack para asegurar que el "contrato" entre Front y Back no se haya roto.
