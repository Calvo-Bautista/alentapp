import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('MedicalCertificate API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let testMemberId: string;
    let createdCertificateId: string;

    const randomSuffix = Math.floor(Math.random() * 100000).toString();
    const testDni = `C${randomSuffix}`;
    const testEmail = `cert${randomSuffix}@test.com`;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        // Crear un socio Activo real en PostgreSQL para poder crear certificados
        const member = await prisma.member.create({
            data: {
                name: 'Socio Test E2E',
                dni: testDni,
                email: testEmail,
                birthdate: new Date('1990-01-01'),
                category: 'Pleno',
                status: 'Activo',
            }
        });
        testMemberId = member.id;
    });

    afterAll(async () => {
        if (createdCertificateId) {
            await prisma.medicalCertificate.deleteMany({
                where: { id: createdCertificateId }
            });
        }
        if (testMemberId) {
            await prisma.member.deleteMany({
                where: { id: testMemberId }
            });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. POST: Debe crear un certificado en la base de datos real', async () => {
        const payload = {
            member_id: testMemberId,
            issue_date: '2025-01-01',
            expiry_date: '2025-12-31',
            doctor_license: 'MP-TEST-123'
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/medical-certificates',
            payload
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        
        expect(body.data.id).toBeDefined();
        expect(body.data.doctor_license).toBe('MP-TEST-123');
        
        createdCertificateId = body.data.id;
        
        // Verificación directa en la DB real via Prisma
        const dbCert = await prisma.medicalCertificate.findUnique({ where: { id: createdCertificateId } });
        expect(dbCert).not.toBeNull();
        expect(dbCert?.doctor_license).toBe('MP-TEST-123');
        expect(dbCert?.member_id).toBe(testMemberId);
    });

    it('2. PUT: Debe actualizar el certificado modificando la base de datos', async () => {
        const updatePayload = {
            doctor_license: 'MP-UPDATED-999'
        };

        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/medical-certificates/${createdCertificateId}`,
            payload: updatePayload
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.doctor_license).toBe('MP-UPDATED-999');

        // Verificar directamente en PostgreSQL que el campo se modificó
        const dbCert = await prisma.medicalCertificate.findUnique({ where: { id: createdCertificateId } });
        expect(dbCert?.doctor_license).toBe('MP-UPDATED-999');
    });

    it('3. DELETE: Debe eliminar físicamente el certificado de la base de datos', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/medical-certificates/${createdCertificateId}`
        });

        expect(response.statusCode).toBe(204);

        // Verificar que Prisma ya no lo encuentra en la DB Real
        const dbCert = await prisma.medicalCertificate.findUnique({ where: { id: createdCertificateId } });
        expect(dbCert).toBeNull();
        
        // Anular variable para que afterAll no intente borrarlo nuevamente
        createdCertificateId = '';
    });
});
