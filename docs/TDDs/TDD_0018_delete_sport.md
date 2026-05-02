---
id: 0018
estado: Propuesto
autor: Franco Portillo
fecha: 2026-05-02
titulo: Eliminación de Deportes Existentes
---

# TDD-0018: Eliminación de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos dar de baja permanentemente un deporte del sistema en caso de que se haya cargado por error, manteniendo la lista limpia y sin registros inválidos.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Borrar un deporte que fue cargado por error de forma rápida. Necesita una advertencia antes de borrar para no cometer equivocaciones ni romper inscripciones de los socios.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita antes de proceder con el borrado.
- El sistema debe validar que el deporte exista antes de intentar borrarlo.
- El sistema debe realizar un borrado físico de la base de datos (hard delete).
- El sistema debe bloquear la eliminación si el deporte ya tiene inscripciones asociadas (`Enrollment`).

## Diseño Técnico (RFC)

### Modelo de Datos

El borrado físico dependerá de la restricción de clave foránea con la tabla `Enrollment` definida en el modelo de datos.

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva, no se envía cuerpo en la petición HTTP:

- Endpoint: `DELETE /api/v1/sports/:id`
- Request Body: `None`

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Método `delete(id)`).
2. Caso de Uso: DeleteSport (Comprueba existencia y delega la eliminación controlando errores de clave foránea).
3. Adaptador de Salida: PostgresSportRepository (Eliminación usando el método `delete` sobre la BD).
4. Adaptador de Entrada: SportController (Ruta HTTP que extrae el `id` y devuelve un status 204).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Deporte inexistente        | Mensaje: "El deporte no existe"               | 404 Not Found             |
| Deporte con inscripciones  | Mensaje: "No se puede borrar, tiene inscriptos"| 409 Conflict              |
| Eliminación exitosa        | Respuesta vacía                               | 204 No Content            |

## Plan de Implementación

1. Ampliar el `SportRepository` y `PostgresSportRepository` con el método `delete`.
2. Crear la lógica de negocio en `DeleteSportUseCase`.
3. Crear el endpoint `DELETE /api/v1/sports/:id` en el `SportController`.
4. Enlazar el botón de eliminación en la vista agregando la confirmación del navegador (`window.confirm`) antes de hacer la llamada.