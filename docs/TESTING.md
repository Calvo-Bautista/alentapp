# Estrategia de Testing - Alentapp

Este documento detalla la infraestructura de testing implementada en el proyecto, cubriendo desde pruebas unitarias hasta tests End-to-End (E2E) Full-Stack.

## 🚀 Resumen de Comandos

### Tests Globales (Raíz)
| Comando | Descripción |
|---|---|
| `npm run e2e:fullstack:run` | **Recomendado para CI**. Levanta Docker, corre tests full-stack y apaga todo. |
| `npm run e2e:fullstack:ui:run` | Levanta Docker y abre la interfaz interactiva de Playwright. |
| `npm run e2e:fullstack:headed:run` | Levanta Docker, corre tests con navegador visible y apaga todo. |
| `npm run e2e:fullstack:up` | Levanta el entorno Docker de pruebas (DB, API, Web). |
| `npm run e2e:fullstack:down` | Apaga el entorno Docker de pruebas y limpia volúmenes. |
| `npm run e2e:fullstack` | Ejecuta los tests E2E Full-Stack (requiere `up` previo). |
| `npm run e2e:fullstack:ui` | Abre la interfaz interactiva (requiere `up` previo). |
| `npm run e2e:fullstack:headed` | Ejecuta con navegador visible (requiere `up` previo). |

### Tests de Backend (`packages/api`)
> **Requisito previo**: antes de correr cualquier test de la API, generá el cliente de Prisma una vez:
> ```bash
> cd packages/api
> npx prisma generate
> ```
> Sin esto, los tests de integración y E2E fallan al importar la app con `Cannot find module '../generated/client'`.

| Comando | Descripción |
|---|---|
| `npm run test` | Ejecuta tests unitarios e integración con Vitest en **modo watch**. |
| `npx vitest run` | Ejecuta toda la suite del backend una sola vez (ideal para CI). |
| `npx vitest run <ruta>` | Ejecuta un archivo de test puntual. |
| `npm run coverage` | Genera reporte de cobertura de código del backend. |

### Tests de Frontend (`packages/web`)
| Comando | Descripción |
|---|---|
| `npm run test` | Ejecuta tests unitarios e integración con Vitest. |
| `npm run coverage` | Genera reporte de cobertura de código del frontend. |
| `npm run e2e` | Ejecuta tests E2E **aislados** (con mocks de red). |

> Los tests E2E con Playwright (frontend y full-stack) requieren los navegadores instalados una única vez: `npx playwright install chromium`.

---

## 🛠 Niveles de Testing

### 1. Tests Unitarios e Integración de Backend (Vitest)
Ubicados en `packages/api/src/**/*.test.ts`.
*   **Unitarios** (`*.test.ts` en `domain/services` y `application`): validan validadores y casos de uso de forma aislada, mockeando los repositorios. No necesitan base de datos ni `prisma generate`.
*   **Integración** (`*.delivery/*.integration.test.ts`): levantan la app de Fastify completa (`buildApp`) con los repositorios mockeados, ejercitando el ciclo Controller → UseCase → Validator. No necesitan una DB corriendo, pero **sí requieren `prisma generate`** porque la app importa el cliente generado.
*   **E2E de API** (`*.delivery/*.e2e.test.ts`): levantan la app contra una **PostgreSQL real** y verifican la persistencia con Prisma. Requieren `prisma generate` + `DATABASE_URL` apuntando a una base de test levantada.

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
*   `e2e-fullstack/global-setup.ts`: Orquestador que espera a la API y limpia la DB.
*   `packages/web/playwright.config.ts`: Configuración para el entorno con mocks.
*   `packages/api/.env.test`: Configuración de la API para el entorno de pruebas.

## 💡 Buenas Prácticas
1.  **Aislamiento de Datos**: Nunca corras los tests E2E contra tu base de datos de desarrollo local. Usá siempre los scripts de Docker provistos.
2.  **Selectores**: Preferí `page.getByRole` o `page.getByText` antes que selectores CSS o IDs, para asegurar que los tests sean accesibles.
3.  **Mocks vs Real**: Usá los tests con mocks para desarrollo rápido de UI y los Full-Stack para asegurar que el "contrato" entre Front y Back no se haya roto.
