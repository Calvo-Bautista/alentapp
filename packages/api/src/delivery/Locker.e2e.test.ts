import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Locker API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdLockerId: string;

    // Generamos un número aleatorio para que el casillero de test no colisione
    // con los datos de desarrollo existentes en la DB.
    const randomNumber = Math.floor(Math.random() * 90000) + 10000;

    beforeAll(async () => {
        // 1. Levantamos la app entera (Fastify + PostgresLockerRepository real)
        app = buildApp();
        await app.ready();

        // 2. Instanciamos Prisma de forma independiente para verificar la DB
        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();
    });

    afterAll(async () => {
        // Tear down: borramos el casillero de test si quedó vivo
        if (createdLockerId) {
            await prisma.locker.deleteMany({ where: { id: createdLockerId } });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. POST: debe crear un casillero en la base de datos real', async () => {
        const payload = {
            number: randomNumber,
            location: 'Vestuario E2E',
            status: 'Available',
            member_id: null,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload,
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);

        expect(body.data.id).toBeDefined();
        expect(body.data.number).toBe(randomNumber);

        // Guardamos el ID para usarlo en los siguientes tests y poder limpiar
        createdLockerId = body.data.id;

        // Verificación directa E2E: ¿se persistió realmente en PostgreSQL?
        const dbLocker = await prisma.locker.findUnique({ where: { id: createdLockerId } });
        expect(dbLocker).not.toBeNull();
        expect(dbLocker?.location).toBe('Vestuario E2E');
        expect(dbLocker?.status).toBe('Available');
    });

    it('2. PUT: debe actualizar la ubicación del casillero modificando la DB', async () => {
        const updatePayload = {
            location: 'Vestuario E2E - Pasillo Renovado',
        };

        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/lockers/${createdLockerId}`,
            payload: updatePayload,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.location).toBe('Vestuario E2E - Pasillo Renovado');

        // Verificar directamente en PostgreSQL que el campo se modificó
        const dbLocker = await prisma.locker.findUnique({ where: { id: createdLockerId } });
        expect(dbLocker?.location).toBe('Vestuario E2E - Pasillo Renovado');
    });
});
