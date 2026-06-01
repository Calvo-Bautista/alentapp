import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Sport API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdSportId: string;

    // Generamos un sufijo aleatorio para que el nombre no colisione
    // con deportes existentes en la base de datos de desarrollo.
    const randomSuffix = Math.floor(Math.random() * 100000).toString();
    const testSportName = `Sport E2E ${randomSuffix}`;

    beforeAll(async () => {
        // 1. Levantamos la app entera (Fastify + repositorios reales contra PostgreSQL)
        app = buildApp();
        await app.ready();

        // 2. Instanciamos Prisma independientemente para verificar directamente la DB
        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();
    });

    afterAll(async () => {
        // Limpiamos la base de datos (Tear down) por si el test falló a mitad
        if (createdSportId) {
            await prisma.sport.deleteMany({
                where: { id: createdSportId },
            });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. POST: Debe crear un deporte en la base de datos real', async () => {
        const payload = {
            name: testSportName,
            description: 'Deporte creado en test E2E',
            max_capacity: 20,
            additional_price: 500,
            requires_medical_certificate: true,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sports',
            payload,
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);

        expect(body.data.id).toBeDefined();
        expect(body.data.name).toBe(testSportName);

        // Guardamos el ID para los siguientes tests y para la limpieza en afterAll
        createdSportId = body.data.id;

        // Verificación directa E2E: ¿Se guardó realmente en PostgreSQL?
        const dbSport = await prisma.sport.findUnique({ where: { id: createdSportId } });
        expect(dbSport).not.toBeNull();
        expect(dbSport?.name).toBe(testSportName);
        expect(dbSport?.max_capacity).toBe(20);
        expect(dbSport?.requires_medical_certificate).toBe(true);
    });

    it('2. PUT: Debe actualizar el deporte modificando la base de datos', async () => {
        const updatePayload = {
            description: 'Descripción actualizada en test E2E',
            max_capacity: 30,
            additional_price: 750,
            requires_medical_certificate: false,
        };

        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/sports/${createdSportId}`,
            payload: updatePayload,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.description).toBe('Descripción actualizada en test E2E');
        expect(body.data.max_capacity).toBe(30);

        // Verificar directamente en PostgreSQL que los campos se actualizaron
        const dbSport = await prisma.sport.findUnique({ where: { id: createdSportId } });
        expect(dbSport?.description).toBe('Descripción actualizada en test E2E');
        expect(dbSport?.max_capacity).toBe(30);
        expect(dbSport?.additional_price).toBe(750);
        expect(dbSport?.requires_medical_certificate).toBe(false);
    });

    it('3. DELETE: Debe eliminar físicamente el deporte de la base de datos', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/sports/${createdSportId}`,
        });

        expect(response.statusCode).toBe(204);

        // Verificar que Prisma ya no lo encuentra en la DB real
        const dbSport = await prisma.sport.findUnique({ where: { id: createdSportId } });
        expect(dbSport).toBeNull();

        // Anular la variable para que afterAll no intente borrarlo nuevamente
        createdSportId = '';
    });
});
