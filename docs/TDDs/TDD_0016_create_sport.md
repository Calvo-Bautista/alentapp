---
id: 0016
estado: Propuesto
autor: Franco Portillo
fecha: 2026-05-02
titulo: Registro de Nuevos Deportes
---

# TDD-0016: Registro de Nuevos Deportes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a la administración incorporar nuevas disciplinas deportivas a la oferta del club, estableciendo desde el inicio los cupos máximos permitidos para no exceder la capacidad física de las instalaciones.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Cargar un nuevo deporte para la temporada de forma rápida. No puede permitirse ingresar deportes duplicados o con un cupo inválido.

### Criterios de Aceptación

- El sistema debe validar que el `max_capacity` (cupo) sea estrictamente mayor a cero.
- El sistema debe validar que el nombre del deporte (`name`) sea único.
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.
- El deporte debe quedar guardado con un identificador único.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Sport` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `name`: Cadena de texto, único e indexado.
- `description`: Cadena de texto.
- `max_capacity`: Número entero, mayor a cero.
- `additional_price`: Número decimal.
- `requires_medical_certificate`: Booleano.

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/sports`
- Request Body (CreateSportRequest):

```ts
{
    name: string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Interface en el Dominio).
2. Caso de Uso: CreateSport (Lógica que verifica si el nombre ya existe y valida la capacidad antes de llamar al repositorio).
3. Adaptador de Salida: PostgresSportRepository (Implementación real del repositorio sobre la BD).
4. Adaptador de Entrada: SportController (Ruta HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Nombre ya registrado       | Mensaje: "Ya existe un deporte con ese nombre"| 409 Conflict              |
| Capacidad en 0 o negativa  | Mensaje: "La capacidad máxima debe ser mayor a 0"| 400 Bad Request           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Definir esquema de persistencia en la BD y correr migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso.
4. Crear formulario en React y conectar con el endpoint del backend.