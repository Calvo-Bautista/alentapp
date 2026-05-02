---
id: 0017
estado: Propuesto
autor: Franco Portillo
fecha: 2026-05-02
titulo: Actualización de Deportes Existentes
---

# TDD-0017: Actualización de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos corregir o modificar la información de un deporte existente, como su descripción o cupo máximo, asegurando que el nombre histórico se mantenga inalterable.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Ajustar el cupo de un deporte porque se habilitó un nuevo salón, o modificar su precio adicional, asegurando que el nombre original no se modifique por error.

### Criterios de Aceptación

- El sistema debe permitir la edición de `description`, `max_capacity`, `additional_price` y `requires_medical_certificate`.
- El atributo `name` es inmutable después de la creación; el sistema debe rechazar su modificación.
- El sistema debe seguir validando que el nuevo `max_capacity` sea mayor a cero.
- Si la edición es correcta, debe retornar los nuevos datos del deporte actualizados.

## Diseño Técnico (RFC)

### Modelo de Datos

No hay cambios en el esquema de base de datos, pero se aplicará la restricción de inmutabilidad sobre el campo `name` a nivel de negocio.

### Contrato de API (@alentapp/shared)

Se omitirá intencionalmente el campo `name` en el contrato para forzar su inmutabilidad:

- Endpoint: `PUT /api/v1/sports/:id`
- Request Body (UpdateSportRequest):

```ts
{
    description?: string;
    max_capacity?: number;
    additional_price?: number;
    requires_medical_certificate?: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Método `update(id, data)`).
2. Caso de Uso: UpdateSport (Orquesta la validación de capacidad y rechaza peticiones que incluyan el campo `name`).
3. Adaptador de Salida: PostgresSportRepository (Actualización usando el método `update` de Prisma).
4. Adaptador de Entrada: SportController (Ruta HTTP que extrae el `id` de la URL).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Deporte inexistente        | Mensaje: "El deporte no existe"               | 404 Not Found             |
| Payload incluye `name`     | Mensaje: "El nombre del deporte es inmutable" | 400 Bad Request           |
| Capacidad en 0 o negativa  | Mensaje: "La capacidad máxima debe ser mayor a 0"| 400 Bad Request           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdateSportRequest`).
2. Ampliar el `SportRepository` con el método `update`.
3. Implementar la lógica en `UpdateSportUseCase` reutilizando validaciones.
4. Crear la ruta `PUT` en el controlador y enlazarla a la app de Fastify.