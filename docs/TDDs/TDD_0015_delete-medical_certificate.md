---
id: 0015
estado: Propuesto
autor: Pedro Moyano Amaya
fecha: 2026-05-02
titulo: Eliminación de Certificado Médico
---

# TDD-0015: Eliminación de Certificado Médico

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos dar de baja permanentemente un certificado médico del sistema, eliminando su registro de la base de datos para mantener la información limpia en caso de cargas duplicadas o erróneas

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Borrar un certificado que fue cargado por error o asignado al socio equivocado. Necesita una advertencia antes de borrar para no cometer equivocaciones irreparables

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con el borrado
- El sistema debe validar que el certificado exista antes de intentar borrarlo
- El sistema debe realizar un borrado físico de la base de datos (hard delete)
- Si el borrado es exitoso, la tabla debe actualizarse automáticamente

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva que solo requiere conocer el identificador, no se envía cuerpo en la petición HTTP.

- Endpoint: `DELETE /api/v1/medical-certificates/:id`

### Componentes de Arquitectura Hexagonal

1. Puerto: MedicalCertificateRepository (Método `delete(id)`).
2. Caso de Uso: DeleteMedicalCertificate (Comprueba existencia previa vía `findById` y delega la eliminación).
3. Adaptador de Salida: DB persistence adapter (Eliminación real en BD).
4. Adaptador de Entrada: MedicalCertificateController (Ruta HTTP que extrae el `id` y devuelve un status 204).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Certificado inexistente    | Mensaje: "El certificado no existe"           | 404 Not Found             |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |
| Eliminación exitosa        | Respuesta vacía                               | 204 No Content            |

## Plan de Implementación

1. Ampliar el `MedicalCertificateRepository` y su implementación en BD con el método `delete`.
2. Crear la lógica de negocio en `DeleteMedicalCertificateUseCase`.
3. Crear el endpoint `DELETE` en el controlador.