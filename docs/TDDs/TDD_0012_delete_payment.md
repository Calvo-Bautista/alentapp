---
id: 0012
estado: Propuesto
autor: Milagros Reale
fecha: 2026-05-03
titulo: Baja de Pago
---


# TDD-0012: Baja de Pago

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos anular un registro de pago que fue cargado por error o que debe ser invalidado, manteniendo la integridad de los datos para auditoría.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Corregir errores de carga sin que la información desaparezca del historial financiero.

### Criterios de Aceptación

- Inmutabilidad: No se permite el borrado físico de los registros en la base de datos.
- Un pago solo puede ser "eliminado" cambiando su estado a `Canceled`.

## Diseño Técnico (RFC)

### Modelo de Datos

- `status`: Cambio de valor a `Canceled`.

### Contrato de API (@alentapp/shared)

- Endpoint: `DELETE /api/v1/payments/:id/cancel`
- Request Body: None

### Componentes de Arquitectura Hexagonal

1. Domain: Regla que impide cancelar un pago que ya tiene estado `Pago`.
2. Application: Caso de uso `CancelPayment` que recupera la entidad y ejecuta la transición de estado.
3. Infrastructure: Adaptador de Prisma que ejecuta un `update` sobre el registro (prohibido usar `delete`).

## Casos de Borde y Errores
| Escenario                | Resultado Esperado                            | Código HTTP     |
| ------------------------ | --------------------------------------------- | --------------- |
| Intento de DELETE físico | Método no implementado/permitido              | 405 Method Not Allowed |
| Pago no encontrado       | Error de recurso inexistente                  | 404 Not Found   |
| Pago ya se encuentra en estado "Cancelado"      | Mensaje: "El pago ya ha sido cancelado previamente"                  | 409 Conflict   |
| Intento de cancelar un pago con status "Paid"      | Mensaje: "No se puede cancelar un pago ya procesado"                  | 409 Conflict   |

## Plan de Implementación

1. Agregar el estado `Canceled` a los tipos compartidos.
2. Crear método `cancel()` en la entidad de dominio.
3. Implementar el endpoint de anulación lógica.
