---
id: 0006
autor: Bautista Calvo
fecha: 2026-05-01
titulo: Eliminar Sanciones
---

# TDD-0001: Alta de Sanciones

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administradores dar de baja sanciones de los socios en el sistema, para poder sacar restricciones de acceso a las instalaciones del club en tiempo real.

### User Persona
*   **Nombre**: Administrativo/a del club
*   **Necesidad**: Borrar sanciones de los socios en el sistema de forma rápida y segura. Se necesita que al eliminar una sanción, el socio este apto para entrar nuevamente a las instalaciones del club.

### Criterios de Aceptación
*   El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con el borrado
*   El sistema debe validar que la sanción exista antes de intentar borrarlo.
*   El sistema debe realizar un borrado físico de la base de datos (hard delete).
*   Si el borrado es exitoso, la tabla debe actualizarse automáticamente.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

*   **Endpoint**: `DELETE /api/v1/discipline/:id`
*   **Request Body**: `None`
*   **Response**: `204 No Content` en caso de éxito.

