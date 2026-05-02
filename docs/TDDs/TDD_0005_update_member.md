---
id: 0005
autor: Bautista Calvo
fecha: 2026-05-01
titulo: Actualización de Sanciones
---

# TDD-0001: Actualización de Sanciones

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administradores actualizar o modificar datos de las sanciones de los socios en el sistema, por si hay que cambiar la restricción de acceso a las instalaciones, o el lapso de tiempo de la sanción.

### User Persona
*   **Nombre**: Administrativo/a del club
*   **Necesidad**: Modificar datos de los socios y sus sanciones en el sistema de forma rápida y segura. Por ejemplo, si se le dio una sanción a un socio, y se le quiere cambiar el lapso de tiempo de la sanción.

### Criterios de Aceptación
*   El sistema debe permitir actualizar todos los datos de la sanción menos el id.
*   El sistema debe validar que, si se cambia el member_id, este pertenezca a otro socio.
*   El sistema debe validar que si se modifican las fechas, la fecha de inicio sea menor a la fecha de fin..
*   Si la edición es correcta, debe retornar los nuevos datos de la sanción actualizados.

