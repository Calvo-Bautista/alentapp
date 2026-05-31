import { test, expect } from '@playwright/test';

test.describe('Payments E2E (UI Integration)', () => {
  let mockMembers: any[] = [];
  let mockPayments: any[] = [];

  test.beforeEach(async ({ page }) => {
    mockMembers = [
      { id: 'm1', name: 'Socio E2E Test', dni: '12345678', status: 'Activo' }
    ];

    mockPayments = [
      {
        id: 'p1',
        amount: 2500,
        month: 5,
        year: 2026,
        status: 'Pending',
        due_date: '2026-05-10',
        member_id: 'm1',
        member_name: 'Socio E2E Test',
        payment_date: null
      }
    ];

    await page.route(/\/api\/v1\/socios/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockMembers })
      });
    });

    await page.route(/\/api\/v1\/payments/, async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockPayments })
        });
      } else if (method === 'POST') {
        const payload = route.request().postDataJSON();
        const newPayment = {
          id: `p-${mockPayments.length + 1}`,
          status: 'Pending',
          ...payload,
          member_name: 'Socio E2E Test',
          payment_date: null
        };
        mockPayments.push(newPayment);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: newPayment })
        });
      } else if (method === 'PUT') {
        const urlObj = new URL(url);
        const id = urlObj.pathname.split('/').pop();
        const payload = route.request().postDataJSON();
        const index = mockPayments.findIndex(p => p.id === id);
        
        if (index > -1) {
          mockPayments[index] = { 
            ...mockPayments[index], 
            ...payload,
            payment_date: payload.status === 'Paid' ? new Date().toISOString() : mockPayments[index].payment_date
          };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: mockPayments[index] })
          });
        } else {
          await route.fulfill({ status: 404 });
        }
      } else if (url.includes('/cancel')) {
        const urlObj = new URL(url);
        const segments = urlObj.pathname.split('/');
        // URL is /api/v1/payments/:id/cancel
        const id = segments[segments.length - 2];
        const index = mockPayments.findIndex(p => p.id === id);
        
        if (index > -1) {
          mockPayments[index] = { ...mockPayments[index], status: 'Canceled' };
          await route.fulfill({ status: 204 });
        } else {
          await route.fulfill({ status: 404 });
        }
      } else if (method === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/payments');
  });

  test('debe registrar un nuevo pago exitosamente', async ({ page }) => {
    await page.getByRole('button', { name: 'Registrar Pago' }).click();
    await expect(page.getByText('Registrar Nuevo Pago')).toBeVisible();

    await page.getByPlaceholder('Seleccione un socio').click();
    await page.getByRole('option', { name: /Socio E2E Test/ }).click();

    await page.getByPlaceholder('0.00').fill('5000');

    await page.getByRole('combobox').nth(1).click(); 
    await page.getByRole('option', { name: '10' }).click();

    await page.getByRole('combobox').nth(2).click();
    const currentYear = new Date().getFullYear().toString();
    await page.getByRole('option', { name: currentYear }).click();

    await page.getByLabel('Fecha de Vencimiento').fill('2026-10-15');

    await page.getByRole('button', { name: 'Registrar Pago', exact: true }).nth(1).click();

    await expect(page.getByText('Registrar Nuevo Pago')).toBeHidden();
    await expect(page.getByText('$5.000,00')).toBeVisible();
    await expect(page.getByText('10/2026')).toBeVisible();
  });

  test('debe permitir marcar un pago como cobrado', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());

    await page.getByRole('button', { name: 'Registrar cobro' }).click();

    await expect(page.getByText('Pagado', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar cobro' })).toBeDisabled();
  });

  test('debe permitir cancelar un pago', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());

    await page.getByRole('button', { name: 'Cancelar pago' }).click();

    await expect(page.getByText('Cancelado', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelar pago' })).toBeDisabled();
  });
});
