---
id: 0007
estado: Propuesto
autor: Franco Jimenez
fecha: 2026-05-01
titulo: Registro de Nuevos Casilleros
---

# TDD-0007: Registro de Nuevos Casilleros

## Contexto de Negocio (PRD)

### Objetivo

Reemplazar la carga manual de casilleros en planillas y permitir que un administrativo dé de alta un casillero de forma digital. El sistema valida que el número no se repita y que no se asigne un casillero fuera de servicio a un socio.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo)
- Necesidad: Cargar nuevos casilleros al inventario cuando se habilitan vestuarios o se reemplazan los existentes. No puede permitirse números duplicados ni asignar un casillero que está en mantenimiento

### Criterios de Aceptación

- El sistema debe validar que el number sea un entero positivo y único
- El sistema debe validar que el member_id, en caso de enviarse, corresponda a un socio existente
- Las únicas combinaciones válidas entre status y member_id son: Available sin socio, Occupied con socio asignado y Maintenance sin socio. Cualquier otra combinación se rechaza
- Si no se envía status explícito, el sistema lo deduce: Available cuando no hay socio asignado, Occupied cuando sí
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad Locker con las siguientes propiedades y restricciones:

- id: Identificador único del casillero (UUID)
- number: Número del casillero. Entero positivo y único entre todos los casilleros
- location: Ubicación física dentro del club (texto libre, ej. "Vestuario A - Pasillo 1")
- status: Estado actual del casillero. Toma uno de tres valores: Available, Occupied o Maintenance. Por defecto Available
- member_id: Referencia opcional al socio asignado. Puede no haber ninguno
- created_at: Fecha de creación del registro

Decisión de diseño: la relación con Member es opcional. Cuando se borra un socio, el casillero queda sin socio asociado en lugar de bloquear el borrado, lo cual es coherente con el hard delete del TDD-0003.

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para que el backend y el frontend usen la misma definición:

- Endpoint: POST /api/v1/lockers
- Request Body (CreateLockerRequest):

```ts
{
    number: number;
    location: string;
    status?: 'Available' | 'Occupied' | 'Maintenance';
    member_id?: string | null;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: LockerRepository (Interface en el Dominio con findByNumber y create)
2. Servicio de Dominio: LockerValidator (agrupa las validaciones de unicidad del número y la regla de "no asignar si está en Maintenance")
3. Caso de Uso: CreateLockerUseCase (corre las validaciones del LockerValidator y delega la persistencia al repositorio)
4. Adaptador de Salida: PostgresLockerRepository (implementación real del repositorio sobre la base de datos)
5. Adaptador de Entrada: LockerController (Ruta HTTP POST /api/v1/lockers)

## Casos de Borde y Errores

| Escenario                                       | Resultado Esperado                                                       | Código HTTP               |
| ----------------------------------------------- | ------------------------------------------------------------------------ | ------------------------- |
| number ya registrado                          | Mensaje: "Ya existe un casillero con ese número"                         | 409 Conflict              |
| number no entero o menor o igual a 0          | Mensaje: "El número de casillero debe ser un entero positivo"            | 400 Bad Request           |
| Asignar member_id con status "Maintenance"  | Mensaje: "No se puede asignar un socio a un casillero en mantenimiento"  | 409 Conflict              |
| member_id no corresponde a un socio existente | Mensaje: "El socio indicado no existe"                                   | 400 Bad Request           |
| Error de conexión a DB                          | Mensaje: "Error interno, reintente más tarde"                            | 500 Internal Server Error |

## Plan de Implementación

1. Definir LockerStatus, LockerDTO y CreateLockerRequest en @alentapp/shared
2. Agregar el enum LockerStatus y el modelo Locker al esquema de la base de datos y correr la migración correspondiente
3. Crear el puerto LockerRepository y el servicio LockerValidator en el Dominio
4. Implementar PostgresLockerRepository y el CreateLockerUseCase
5. Crear el endpoint POST /api/v1/lockers en LockerController y registrarlo en app.ts
6. Crear formulario en React (modal sobre LockersView.tsx) y conectar con el endpoint del backend
