---
id: 0014
estado: Propuesto
autor: Pedro Moyano Amaya
fecha: 2026-05-02
titulo: Actualización de Certificado Médico
---

# TDD-0014: Actualización de Certificado Médico

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos corregir o modificar la información de un certificado médico existente en el sistema, o cambiar su estado de validación una vez comprobado el documento físico

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Modificar datos de los certificados rápidamente. Por ejemplo, corregir una matrícula mal tipeada o cambiar el estado a validado una vez que se verificó la autenticidad del mismo

### Criterios de Aceptación

- El sistema debe permitir actualizar uno, varios o todos los campos del certificado
- El sistema debe validar que, si se cambian las fechas, el vencimiento siga siendo posterior a la emisión
- Si la edición es correcta, debe retornar los nuevos datos del certificado actualizados

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete `@alentapp/shared` para la transferencia de datos.

- Endpoint: `PUT /api/v1/medical-certificates/:id`
- Request Body (UpdateMedicalCertificateRequest):

```ts
{
    issue_date?: string;
    expiry_date?: string;
    doctor_license?: string;
    is_validated?: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: MedicalCertificateRepository (Interface en el Dominio con método update)
2. Caso de Uso: UpdateMedicalCertificate (Lógica que verifica la existencia y aplica las validaciones de negocio correspondientes)
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD)
4. Adaptador de Entrada: MedicalCertificateController (Ruta HTTP que extrae el id de la URL)

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                | Código HTTP actual        |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Certificado inexistente         | Mensaje: "El certificado no existe"     | 404 Not Found           |
| Modificación a fecha inválida | Mensaje: "El vencimiento debe ser posterior a la emisión"      | 400 Bad Request             |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error        |

## Plan de Implementación

1. Actualizar las interfaces en el paquete @alentapp/shared (UpdateMedicalCertificateRequest)
2. Ampliar el MedicalCertificateRepository con el método update
3. Implementar la lógica en UpdateMedicalCertificateUseCase
4. Crear la ruta PUT /api/v1/medical-certificates/:id en el controlador y registrarla.
5. Adaptar la vista en React para permitir la edición y el cambio de estado, conectándola con el endpoint del backend