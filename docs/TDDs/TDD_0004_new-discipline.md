---
id: 0004
autor: Bautista Calvo
fecha: 2026-05-01
titulo: Alta de Sanciones
---

# TDD-0001: Alta de Sanciones

## Contexto de Negocio (PRD)

### Objetivo
Eliminar el registro manual en papel y permitir a los administradores dar de alta sanciones de los socios en el sistema, para poder restringir el acceso a las instalaciones del club en tiempo real.

### User Persona
*   **Nombre**: Administrativo/a del club
*   **Necesidad**: Cargar datos de los socios y sus sanciones en el sistema de forma rápida y segura, para que haya trazabilidad entre los ingresos a las instalaciones y las sanciones que tienen los socios.

### Criterios de Aceptación
*   El sistema debe validar que la sanción este asignada obligatoriamente a un socio existente.
*   El sistema debe validar que la sanción tenga una fecha de inicio y una fecha de fin.
*   El sistema debe validar que la fecha de inicio sea menor a la fecha de fin.
*   El sistema debe validar que la sanción tenga un tipo de sanción (si es total o no).
*   El sistema debe permitir que la sanción tenga un motivo.
*   Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar los datos del formulario.

