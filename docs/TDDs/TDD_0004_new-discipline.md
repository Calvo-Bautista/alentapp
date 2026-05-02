---
id: 0004
autor: Bautista Calvo
fecha: 2026-05-01
titulo: Alta de Sanciones
---

# TDD-0004: Alta de Sanciones

## Contexto de Negocio (PRD)

### Objetivo
Eliminar el registro manual en papel y permitir a los administradores dar de alta sanciones de los socios en el sistema, para poder restringir el acceso a las instalaciones del club en tiempo real.

### User Persona
*   **Nombre**: Administrativo/a del club
*   **Necesidad**: Cargar datos de los socios y sus sanciones en el sistema de forma rápida y segura, para que haya trazabilidad entre los ingresos a las instalaciones y las sanciones que tienen los socios.

### Criterios de Aceptación
*   El sistema debe validar que la sanción este asignada obligatoriamente a un socio existente.
*   El sistema debe validar que la sanción tenga una fecha de inicio y una fecha de fin.
*   El sistema debe validar que la fecha de inicio sea menor a la fecha de fin.
*   El sistema debe validar que la sanción tenga un tipo de sanción (si es total o no).
*   El sistema debe permitir que la sanción tenga un motivo.
*   Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar los datos del formulario.


## Diseño Técnico (RFC)

### Modelo de Datos

Se define la entidad `discipline` con las siguientes propiedades y restricciones
- `id`: Identificador único universal (UUID).
- `reason`: Cadena de texto, representa la razon de la sanción (string).
- `start_date`: Fecha de inicio de la sanción (date).
- `end_date`: Fecha de finalización de la sanción posterior al inicio (date).
- `is_total_suspension`: Indicador booleano de si la sanción es total (boolean).
- `member_id`: Clave foránea relacionada con el socio (UUID).

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

*   **Endpoint**: `POST /api/v1/discipline`
*   **Request Body**:
```ts
{
    reason: string,
    start_date: date,
    end_date: date,
    is_total_suspension: boolean,
    member_id: string
}
```
### Componentes de Arquitectura Hexagonal

1. Puerto: DisciplineRepository (Interface en el Dominio).
2. Servicio de dominio: DisciplineValidator (Lógica que verifica que el socio a sancionar ya exista, y que la fecha de inicio sea anterior a la fecha de fin).
3. Caso de Uso: CreateDiscipline (Usa las validaciones del servicio de dominio y luego llama al repositorio para crear la sanción).|
4. Adaptador de Salida: PostgresDisciplineRepository (Implementación real en BD).
5. Adaptador de Entrada: DisciplineController (Ruta HTTP que recibe la request de la sancion).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| member_id no existente           | Mensaje: "No existe ese socio en el club"       | 400 Bad Request           |
| start_date mayor a end_date           | Mensaje: "La fecha de inicio debe ser menor a la fecha de fin"              | 400 Bad Request           |
| start_date o end_date vacíos | Mensaje: "La sanción debe tener un lapso de tiempo" | 400 Bad Request |
| campo member_id vacío | Mensaje: "La sanción debe corresponder a un socio" | 400 Bad Request |
| error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación
1. Definir esquema de persistencia del modelo discipline y correr migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el servicio del caso de uso para garantizar la correcta creación de la sanción.
4. Crear el endpoint POST en el controller para persistir la nueva sanción, y conectarlo con app.ts.
5. Crear forms en React y conectarlo con el endpoint del backend.
