---
id: 0008
estado: Propuesto
autor: Franco Jimenez
fecha: 2026-05-01
titulo: Actualización de Casilleros Existentes
---

# TDD-0008: Actualización de Casilleros Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos modificar la información de un casillero existente: corregir la ubicación, pasarlo a "Maintenance" cuando lo reportan roto, y asignar o desasignar el socio desde el mismo registro.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo)
- Necesidad: Modificar el estado de los casilleros desde la tabla del panel de administración. Por ejemplo, asignar el casillero #42 a un socio recién dado de alta, marcar el #15 como "Maintenance" cuando lo reportan roto, o liberarlo cuando el socio deja el club

### Criterios de Aceptación

- El sistema debe permitir actualizar uno, varios o todos los campos del casillero
- El sistema debe validar que, si se cambia el number, este no pertenezca ya a otro casillero
- El sistema debe validar que el member_id, en caso de enviarse, corresponda a un socio existente
- La invariante entre status y member_id se mantiene en cada actualización: Available y Maintenance no tienen socio asignado, Occupied siempre lo tiene
- Para pasar un casillero a Maintenance, primero hay que desasignar al socio. Si el casillero todavía está Occupied, el sistema rechaza el cambio de status hasta que se desasigne
- Cuando cambia member_id y el cliente no envía un status explícito, el sistema lo transiciona automáticamente: a "Occupied" si se asigna un socio y a "Available" si se desasigna
- Si la edición es correcta, debe retornar los nuevos datos del casillero actualizado

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se trata de una actualización parcial (PATCH a nivel de negocio, aunque el endpoint implemente PUT).

- Endpoint: PUT /api/v1/lockers/:id
- Request Body (UpdateLockerRequest):

```ts
{
    number?: number;
    location?: string;
    status?: 'Available' | 'Occupied' | 'Maintenance';
    member_id?: string | null;
}
```

Decisión de diseño: la asignación y desasignación de socio se resuelve por este mismo endpoint mediante el campo member_id, en lugar de exponer rutas dedicadas (/assign, /unassign). Así la API queda parecida al ABM de socios (TDD-0002) y no duplicamos validaciones.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: LockerRepository (Método update(id, data))
2. **Servicio de Dominio**: LockerValidator (Reutiliza las validaciones de unicidad del número, la regla de Maintenance y la existencia del socio)
3. **Caso de Uso**: UpdateLockerUseCase (Valida los cambios, calcula el nuevo status si hace falta y llama al repositorio)
4. **Adaptador de Salida**: PostgresLockerRepository (Actualización del registro a través del repositorio sobre la base de datos)
5. **Adaptador de Entrada**: LockerController (Ruta HTTP que extrae el id de la URL y mapea excepciones a códigos HTTP)

## Casos de Borde y Errores

| Escenario                                       | Resultado Esperado                                                       | Código HTTP actual        |
| ----------------------------------------------- | ------------------------------------------------------------------------ | ------------------------- |
| Casillero inexistente                           | Mensaje: "El casillero no existe"                                        | 400 Bad Request           |
| number ya registrado por otro casillero       | Mensaje: "Ya existe un casillero con ese número"                         | 409 Conflict              |
| Asignar member_id con status "Maintenance"  | Mensaje: "No se puede asignar un socio a un casillero en mantenimiento"  | 409 Conflict              |
| Cambiar status a "Maintenance" con socio asignado | Mensaje: "Hay que desasignar al socio antes de pasar el casillero a mantenimiento" | 409 Conflict        |
| member_id no corresponde a un socio existente | Mensaje: "El socio indicado no existe"                                   | 400 Bad Request           |
| Asignación sin status enviado                 | Transiciona status a "Occupied" silenciosamente                        | 200 OK                    |
| Desasignación (member_id = null)              | Transiciona status a "Available" silenciosamente                       | 200 OK                    |
| Error de conexión a DB                          | Mensaje: "Error interno, reintente más tarde"                            | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete @alentapp/shared (UpdateLockerRequest)
2. Ampliar el LockerRepository con el método update
3. Implementar la lógica en UpdateLockerUseCase utilizando el LockerValidator centralizado
4. Crear la ruta PUT en el controlador y enlazarla a la app de Fastify
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creación para permitir la edición
