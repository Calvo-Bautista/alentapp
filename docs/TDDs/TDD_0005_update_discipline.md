---
id: 0005
autor: Bautista Calvo
fecha: 2026-05-01
titulo: Actualización de Sanciones
---

# TDD-0005: Actualización de Sanciones

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administradores actualizar o modificar datos de las sanciones de los socios en el sistema, por si hay que cambiar la restricción de acceso a las instalaciones, o el lapso de tiempo de la sanción.

### User Persona
*   **Nombre**: Administrativo/a del club
*   **Necesidad**: Modificar datos de los socios y sus sanciones en el sistema de forma rápida y segura. Por ejemplo, si se le dio una sanción a un socio, y se le quiere cambiar el lapso de tiempo de la sanción.

### Criterios de Aceptación
*   El sistema debe permitir actualizar todos los datos de la sanción menos el id.
*   El sistema debe validar que, si se cambia el member_id, este pertenezca a otro socio.
*   El sistema debe validar que si se modifican las fechas, la fecha de inicio sea menor a la fecha de fin..
*   Si la edición es correcta, debe retornar los nuevos datos de la sanción actualizados.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

*   **Endpoint**: `PUT /api/v1/discipline/:id`
*   **Request Body (UpdateDisciplineRequest)**:
```ts
{
    reason?: string,
    start_date?: date,
    end_date?: date,
    is_total_suspension?: boolean,
    member_id?: string
}
```
### Componentes de Arquitectura Hexagonal

1. Puerto: DisciplineRepository (Método update(id, data)).
2. Servicio de dominio: DisciplineValidator (Lógica que verifica que el socio a sancionar ya exista, y que la fecha de inicio sea anterior a la fecha de fin).
3. Caso de Uso: UpdateDisciplineUseCase (Orquesta la validación y llama al repositorio).
4. Adaptador de Salida: PostgresDisciplineRepository (Implementación real en BD mediante Prisma).
5. Adaptador de Entrada: DisciplineController (Ruta HTTP que agarra el id de la url y lo delega al caso de uso).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| member_id no existente           | Mensaje: "No existe ese socio en el club"       | 400 Bad Request           |
| id de la sanción no existente           | Mensaje: "No existe esa sanción en el club"       | 400 Bad Request           |
| start_date mayor a end_date           | Mensaje: "La fecha de inicio debe ser menor a la fecha de fin"              | 400 Bad Request           |
| start_date o end_date vacíos | Mensaje: "La sanción debe tener un lapso de tiempo" | 400 Bad Request |
| campo member_id vacío | Mensaje: "La sanción debe corresponder a un socio" | 400 Bad Request |
| error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación
1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdateDisciplineRequest`).
2. Ampliar el `DisciplineRepository` con el método `update`.
3. Implementar la lógica en `UpdateDisciplineUseCase` utilizando el `DisciplineValidator` centralizado.
4. Crear la ruta `PUT` en el controlador.
5. Crear forms en React y conectarlo con el endpoint del backend.
