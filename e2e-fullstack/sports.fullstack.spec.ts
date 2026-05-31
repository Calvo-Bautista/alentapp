import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Deportes.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5174
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 */

test.describe('Sports Full-Stack E2E', () => {

  test('debe mostrar el estado vacío cuando no hay deportes en la DB', async ({ page }) => {
    await page.goto('/sports');
    await expect(page.getByText('No hay deportes registrados aún.')).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un deporte real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('/sports');

    // Abrir modal de creación
    await page.locator('button:has-text("Agregar Deporte")').click();
    await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();

    // Llenar formulario con datos reales
    await page.getByPlaceholder('Ej. Tenis').fill('Futbol Test');
    await page.getByPlaceholder('Ej. Deporte de raqueta individual o dobles').fill('Deporte de pelota en equipo');
    await page.getByPlaceholder('Ej. 20').fill('15');
    await page.getByPlaceholder('Ej. 500').fill('1200');
    await page.getByText('Sí, se requiere').click();

    // Guardar
    await page.getByRole('button', { name: 'Crear deporte' }).click();

    // Esperar que el modal se cierre y el deporte aparezca en la tabla real
    await expect(page.getByRole('button', { name: 'Crear deporte' })).toBeHidden();
    await expect(page.getByText('Futbol Test')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Deporte de pelota en equipo')).toBeVisible();
    await expect(page.getByText('$1.200')).toBeVisible(); // En formato es-AR, 1200 es $1.200 o $1.200,00. En sports.tsx usa LocalString.
  });

  test('debe editar el deporte creado y ver el cambio en la tabla', async ({ page }) => {
    await page.goto('/sports');

    // Esperar que el deporte del test anterior esté en la tabla
    await expect(page.getByText('Futbol Test')).toBeVisible({ timeout: 10000 });

    // Clic en Editar
    await page.getByRole('button', { name: /Editar deporte/i }).first().click();
    await expect(page.getByText('Editar Deporte')).toBeVisible();

    // Cambiar la descripción y la capacidad
    await page.getByPlaceholder('Ej. Deporte de raqueta individual o dobles').fill('Futbol modificado en test');
    await page.getByPlaceholder('Ej. 20').fill('22');

    // Guardar
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeHidden();

    // Verificar cambio en la tabla
    await expect(page.getByText('Futbol modificado en test')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('22')).toBeVisible();
  });

  test('debe eliminar el deporte y mostrar el estado vacío', async ({ page }) => {
    await page.goto('/sports');

    // El deporte debería seguir ahí tras el test anterior
    await expect(page.getByText('Futbol Test')).toBeVisible({ timeout: 10000 });

    // Aceptar el confirm del navegador automáticamente
    page.on('dialog', (dialog) => dialog.accept());

    // Clic en borrar
    await page.getByRole('button', { name: /Eliminar deporte/i }).first().click();

    // La tabla debería quedar vacía
    await expect(page.getByText('No hay deportes registrados aún.')).toBeVisible({ timeout: 10000 });
  });
});
