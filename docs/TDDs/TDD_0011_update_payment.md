---
id: 0011
estado: Propuesto
autor: Milagros Reale
fecha: 2026-05-03
titulo: Modificación de Pago
---

# TDD-0011: Modificación de Pago

## Contexto de Negocio (PRD)

### Objetivo

Actualizar la información de un pago existente, para registrar la fecha efectiva de cobro y/o el estado del pago.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Actualizar el estado de una deuda cuando el socio realiza el pago.

### Criterios de Aceptación

- Si el estado cambia a `Paid`, se debe registrar la fecha y hora actual en `payment_date`
- No se permite modificar registros que se encuentren en estado `Canceled`.

## Diseño Técnico (RFC)

### Modelo de Datos

- `status`: `Pending` | `Paid` .
- `payment_date`: `datetime`

### Contrato de API (@alentapp/shared)

- Endpoint: `PUT /api/v1/payments/:id`
- Request Body:
```ts
{  
    id: string;
    amount: number;
    status: 'Pending' | 'Paid' ;
    payment_date: string;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: PaymentRepository (Interface en el Dominio con update)  
2. Servicio de Dominio: PaymentUpdateValidator (Valida que el registro no esté cancelado antes de editar y gestiona la fecha de pago)  
3. Caso de Uso: UpdatePaymentUseCase (Actualiza campos permitidos y asigna payment_date si el status pasa a Paid)  
4. Adaptador de Salida: PrismaPaymentRepository (Ejecuta la actualización en la base de datos)  
5. Adaptador de Entrada: PaymentController (Ruta HTTP PUT /api/v1/payments/:id)

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Intentar modificar un pago con estado "Canceled"       | Mensaje: "No se pueden editar pagos anulados"   | 409 Conflict              |
| Cambio de status a "Paid" sin fecha | El sistema debe asignar payment_date automáticamente | 200 OK           |
| Modificar `amount` a un valor negativo    | Mensaje: "El nuevo monto debe ser positivo" | 400 Bad Request | 
| Error de concurrencia (ID modificado simultáneamente)     | Mensaje: "El registro fue modificado, recargue la página"  | 409 Conflict              |

### Plan de Implementación

- Definir UpdatePaymentRequest en @alentapp/shared con campos opcionales  
- Crear lógica en el Dominio para que al setear el status como Paid, se registre el DateTime actual  
- Implementar el UpdatePaymentUseCase verificando la pre-existencia del registro  
- Configurar el endpoint PUT en el controlador de infraestructura  
- Implementar el formulario de edición en el frontend sincronizando los estados del componente