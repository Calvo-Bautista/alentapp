---
id: 0009
estado: Propuesto
autor: Franco Jimenez
fecha: 2026-05-01
titulo: Eliminación de Casilleros Existentes
---

# TDD-0009: Eliminación de Casilleros Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos dar de baja permanentemente un casillero del sistema, eliminando su registro de la base de datos para mantener el inventario actualizado y libre de casilleros cargados por error.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo)
- Necesidad: Borrar un casillero cargado por error o retirado del club, de forma rápida desde la misma tabla principal. Necesita una advertencia antes de borrar, sobre todo si el casillero está asignado a un socio

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con el borrado
- El sistema debe validar que el casillero exista antes de intentar borrarlo
- El sistema debe realizar un borrado físico de la base de datos (hard delete)
- Si el casillero estaba asignado a un socio, se borra igual y el socio queda sin casillero
- Si el borrado es exitoso, la tabla debe actualizarse automáticamente

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva que solo requiere conocer el identificador, no se envía cuerpo en la petición HTTP.

- Endpoint: DELETE /api/v1/lockers/:id
- Request Body: None
- Response: 204 No Content en caso de éxito

### Componentes de Arquitectura Hexagonal

1. **Puerto**: LockerRepository (Método delete(id))
2. **Caso de Uso**: DeleteLockerUseCase (Comprueba existencia previa vía findById y delega la eliminación)
3. **Adaptador de Salida**: PostgresLockerRepository (Eliminación del registro a través del repositorio sobre la base de datos)
4. **Adaptador de Entrada**: LockerController (Ruta HTTP que extrae el id y devuelve un status 204)

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP actual        |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Casillero inexistente      | Mensaje: "El casillero no existe"             | 400 Bad Request           |
| Error de conexión a DB     | Mensaje: error del motor de base de datos     | 400 Bad Request           |
| Eliminación exitosa        | Respuesta vacía                               | 204 No Content            |

## Plan de Implementación

1. Ampliar el LockerRepository y PostgresLockerRepository con el método delete
2. Crear la lógica de negocio en DeleteLockerUseCase
3. Crear el endpoint DELETE /api/v1/lockers/:id en el LockerController y registrarlo en app.ts
4. Añadir el método delete al servicio Frontend (lockers.ts)
5. Enlazar el botón de eliminación en LockersView.tsx agregando la confirmación del navegador (window.confirm) antes de hacer la llamada
