---
id: 0010
estado: Propuesto
autor: Milagros Reale
fecha: 2026-05-03
titulo: Alta de Pago
---

# TDD-0010: Registro de Nuevos Pago

## Contexto de Negocio (PRD)

### Objetivo

Reemplazar el sistema de administracion de pagos de los socios de forma manual a forma digital, por cada socio.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Registrar una nueva deuda en el sistema asociada a un socio específico para su posterior cobro.

### Criterios de Aceptación

- El sistema debe validar que el member_id corresponda a un socio existente
- El pago debe quedar guardado con estado `Pending` por defecto
- La fecha de pago debe quedar guardado con estado `null` por defecto
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Payment` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `amount`: Monto de pago, numérico flotante con 2 decimales.
- `month`: Fecha de mes.
- `year`: Fecha de año.
- `status`: Enumeración (`Pending`, `Paid`, `Canceled`), con valor por defecto `Pending`.
- `due_date`: Fecha de vencimiento.
- `payment_date`: Fecha de pago, valor por defecto `null`.
- `member_id`: Identificador único universal (UUID) de un socio existente.

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/payments`
- Request Body:

```ts
{
    month: string;
    year: string;
    due_date: string;
    amount: number;
    member_id: string;
}
```


### Componentes de Arquitectura Hexagonal


1. Puerto: PaymentRepository (Interface en el Dominio con create y findById)  
2. Servicio de Dominio: PaymentValidator (Valida que el monto sea positivo y que el mes/año sean coherentes)
3. Caso de Uso: CreatePaymentUseCase (Corre las validaciones del PaymentValidator, verifica la existencia del Member y delega la persistencia)  
4. Adaptador de Salida: PrismaPaymentRepository (Implementación real sobre la base de datos usando Prisma)  
5. Adaptador de Entrada: PaymentController (Ruta HTTP POST /api/v1/payments)

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| `amount` menor a 0         | Mensaje: "El monto del pago debe ser mayor a 0 (cero)"   | 400 Bad Request              |
| `member_id` no corresponde a un socio existente | Mensaje: "El socio indicado no existe"| 400 Bad Request           |
| `month` fuera del rango 1-12    | Mensaje: "El mes indicado no es válido" | 400 Bad Request | 
| `year` fuera de un rango razonable    | Mensaje: "El año indicado no es válido" | 400 Bad Request | 
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"  | 500 Internal Server Error               |

## Plan de Implementación

1. Definir PaymentStatus, PaymentDTO y CreatePaymentRequest en @alentapp/shared
2. Agregar el modelo Payment al esquema de Prisma con los campos amount, month, year, status, due_date, payment_date y member_id
3. Crear el puerto PaymentRepository y el servicio PaymentValidator en el Dominio  
4. Implementar PrismaPaymentRepository y el CreatePaymentUseCase
5. Crear el endpoint `POST /api/v1/payments` en PaymentController y registrarlo en las rutas
6. Crear formulario de alta en React (modal sobre la vista de pagos) y conectar con el backend
