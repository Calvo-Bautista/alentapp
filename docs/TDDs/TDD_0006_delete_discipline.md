---
id: 0006
autor: Bautista Calvo
fecha: 2026-05-01
titulo: Eliminar Sanciones
---

# TDD-0006: Alta de Sanciones

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

### Componentes de Arquitectura Hexagonal

1. Puerto: DisciplineRepository (Método delete(id)).
2. Caso de Uso: DeleteDisciplineUseCase (Comprueba existencia previa vía findById y delega la eliminación).
3. Adaptador de Salida: PostgresDisciplineRepository (Eliminación del registro mediante el repositorio con el método delete sobre la base de datos).
4. Adaptador de Entrada: DisciplineController (Ruta HTTP que extrae el id de la request y devuelve un status 204 en caso de éxito).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| id no existente           | Mensaje: "No existe esa sanción en el club"       | 400 Bad Request           |
| eliminación exitosa           | Mensaje: "Respuesta vacia"              | 204 No Content           |
| error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación
1. Ampliar el DisciplineRepository y PostgresDisciplineRepository con el método delete.
2. Crear la lógica de negocio en DeleteDisciplineUseCase.
3. Crear el endpoint DELETE /api/v1/discipline/:id en el DisciplineController y registrar rutas.
4. Añadir el método delete al servicio Frontend correspondiente.
5. Enlazar el botón de eliminación en la vista de DisciplinesView.tsx agregando la confirmación antes de hacer la llamada a la API.
