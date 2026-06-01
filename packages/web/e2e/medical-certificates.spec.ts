import { test, expect } from '@playwright/test';

test.describe('Medical Certificates E2E (UI Integration)', () => {
  let mockMembers: any[] = [];
  let mockCertificates: any[] = [];

  test.beforeEach(async ({ page }) => {
    mockMembers = [
      { id: 'socio-1', name: 'Socio E2E Test', dni: '12345678', status: 'Activo' }
    ];

    mockCertificates = [
      {
        id: 'cert-1',
        member_id: 'socio-1',
        issue_date: '2025-01-01',
        expiry_date: '2025-12-31',
        doctor_license: 'MP-111',
        is_validated: false,
        created_at: '2025-01-01T00:00:00.000Z'
      }
    ];

    await page.route(/\/api\/v1\/socios/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockMembers })
      });
    });

    await page.route(/\/api\/v1\/medical-certificates/, async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const urlObj = new URL(url);

      if (method === 'GET') {
        // La URL es /api/v1/medical-certificates/:memberId
        const segments = urlObj.pathname.split('/');
        const memberId = segments[segments.length - 1];
        const filtered = mockCertificates.filter(c => c.member_id === memberId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: filtered })
        });
      } else if (method === 'POST') {
        const payload = route.request().postDataJSON();
        const newCert = {
          id: `cert-${mockCertificates.length + 1}`,
          ...payload,
          is_validated: true,
          created_at: new Date().toISOString()
        };
        mockCertificates.push(newCert);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: newCert })
        });
      } else if (method === 'PUT') {
        const id = urlObj.pathname.split('/').pop();
        const payload = route.request().postDataJSON();
        const index = mockCertificates.findIndex(c => c.id === id);
        
        if (index > -1) {
          mockCertificates[index] = { 
            ...mockCertificates[index], 
            ...payload
          };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: mockCertificates[index] })
          });
        } else {
          await route.fulfill({ status: 404 });
        }
      } else if (method === 'DELETE') {
        const id = urlObj.pathname.split('/').pop();
        const index = mockCertificates.findIndex(c => c.id === id);
        
        if (index > -1) {
          mockCertificates.splice(index, 1);
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

    await page.goto('/medical-certificates');
  });

  test('debe mostrar los certificados al seleccionar un socio', async ({ page }) => {
    await expect(page.getByText('Seleccioná un socio para ver sus certificados médicos.')).toBeVisible();

    // Seleccionar socio en el filtro
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /Socio E2E Test/ }).click();

    await expect(page.getByText('MP-111')).toBeVisible();
    await expect(page.getByText('No validado')).toBeVisible();
  });

  test('debe registrar un nuevo certificado exitosamente', async ({ page }) => {
    // Primero seleccionamos el socio para que la tabla se habilite y el modal sepa a quién asignarlo
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /Socio E2E Test/ }).click();

    await page.getByRole('button', { name: 'Agregar Certificado' }).click();
    await expect(page.getByText('Agregar Nuevo Certificado')).toBeVisible();

    // Llenar campos
    await page.getByLabel('Fecha de Emisión').fill('2026-05-01');
    await page.getByLabel('Fecha de Vencimiento').fill('2026-11-01');
    await page.getByLabel('Matrícula del Médico').fill('MP-NUEVO-123');

    // Enviar el formulario
    await page.getByRole('dialog').getByRole('button', { name: 'Crear Certificado' }).click();

    // Verificar en tabla
    await expect(page.getByText('Agregar Nuevo Certificado')).toBeHidden();
    await expect(page.getByText('MP-NUEVO-123')).toBeVisible();
  });

  test('debe permitir editar un certificado existente', async ({ page }) => {
    // Seleccionar socio
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /Socio E2E Test/ }).click();

    // Abrir modal de edición
    await page.getByRole('button', { name: 'Editar certificado' }).first().click();
    await expect(page.getByText('Editar Certificado')).toBeVisible();

    // Cambiar la matrícula
    await page.getByLabel('Matrícula del Médico').fill('MP-MODIFICADA');

    // Guardar cambios
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar Cambios' }).click();

    await expect(page.getByText('Editar Certificado')).toBeHidden();
    await expect(page.getByText('MP-MODIFICADA')).toBeVisible();
  });

  test('debe permitir eliminar un certificado', async ({ page }) => {
    // Configurar aceptación automática del dialog nativo "window.confirm"
    page.on('dialog', dialog => dialog.accept());

    // Seleccionar socio
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /Socio E2E Test/ }).click();

    // Verificar que el certificado existe
    await expect(page.getByText('MP-111')).toBeVisible();

    // Eliminar
    await page.getByRole('button', { name: 'Eliminar certificado' }).first().click();

    // Verificar que la tabla ya no tiene el certificado
    await expect(page.getByText('MP-111')).toBeHidden();
    await expect(page.getByText('Este socio no tiene certificados médicos.')).toBeVisible();
  });
});
