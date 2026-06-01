import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Discipline API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdDisciplineId: string;
    let testMemberId: string; // almacena el id del socio de prueba para asociar sanciones

    beforeAll(async () => {
        // 1. Levantamos la app entera (incluyendo PostgreSQL via el Repositorio original)
        app = buildApp();
        await app.ready();
        
        // 2. Instanciamos Prisma independientemente para comprobar la Base de Datos
        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        // Crear un socio de prueba para asociar sanciones
        const testMember = await prisma.member.create({
            data: {
                name: 'Socio Test E2E Discipline',
                dni: `${Date.now()}`,
                email: `${Date.now()}@test.com`,
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',
            }
        });
        testMemberId = testMember.id;
    });

    afterAll(async () => {
        // Limpiamos la base de datos (Tear down) eliminando el registro si quedó vivo
        if (createdDisciplineId) {
            await prisma.discipline.deleteMany({
                where: { id: createdDisciplineId }
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

});