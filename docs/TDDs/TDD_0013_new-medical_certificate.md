---
id: 0013
estado: Propuesto
autor: Pedro Moyano Amaya
fecha: 2026-05-02
titulo: Registro de nuevo Certificado Medico
---

# TDD-0013: Registro de nuevo Certificado Medico

## Contexto de Negocio (PRD)

### Objetivo

Eliminar el riesgo de que un socio realice actividad física sin respaldo médico, garantizando que solo exista un certificado vigente por socio mediante la invalidación automática de registros anteriores al cargar uno nuevo

### User Persona
*   **Nombre**: Alberto (Tesorero/Administrativo).
*   **Necesidad**: Cargar el nuevo certificado de un socio de forma rápida, dejando que el sistema gestione automáticamente cual es el registro vigente sin preocuparse por los anteriores

### Criterios de Aceptación
*   El sistema debe validar que el socio exista en el sistema y este activo
*   Al crear un certificado nuevo, cualquier certificado anterior del mismo socio debe quedar invalidado de forma automática
*   El sistema debe validar que la fecha de emisión no sea futura y que la fecha de vencimiento sea posterior a la de emisión.
*   El estado inicial del nuevo certificado será "Falso" por defecto, requiriendo validación posterior para ser el "Activo"

## Diseño Técnico (RFC)

### Modelo de Datos

Se definira la entidad `MedicalCertificate` con las siguientes propiedades y restricciones:

*   `id`: Identificador único universal (UUID)
*   `member_id`: UUID, clave foranea a la tabla "Member"
*   `issue_date`: Fecha de creacion/emision
*   `expiry_date`: Fecha de vencimiento, debe ser mayor a la fecha de emision
*   `doctor_license`: Cadena de texto (Matrícula del médico)
*   `is_validated`: Booleano con valor por defecto "Falso".

### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]
*   **Endpoint**: `POST /api/v1/medical-certificates`
*   **Request Body** (`CreateMedicalCertificateRequest`):
```ts
{
    member_id: string;
    issue_date: string;
    expiry_date: string;
    doctor_license: string;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: MedicalCertificateRepository (Interface en el Dominio con métodos para crear e invalidar registros previos)
2. Caso de Uso: CreateMedicalCertificate (Lógica que invalida certificados anteriores y verifica fechas antes de llamar al repositorio)
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: MedicalCertificateController (Ruta HTTP)

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
|  Socio inexistente   |   Mensaje: "El socio indicado no existe"   | 404 Not Found              |
| Fechas incongruentes | Mensaje: "El vencimiento debe ser posterior a la emisión"              | 400 Bad Request           |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde"          | 500 Internal Server Error           |
| Socio con certificados previos | El sistema los invalida automáticamente y crea el nuevo              | 201 Created           |

## Plan de Implementación
1. Definir esquema de persistencia y correr migración.
2. Crear tipos en shared y puerto en dominio.
3. Implementar lógica de transacción (invalidar anteriores + crear nuevo) en el repositorio y caso de uso
4. Crear controlador HTTP e integrarlo al router.