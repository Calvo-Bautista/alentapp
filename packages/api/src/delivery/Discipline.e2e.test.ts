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

    it('1. GET: Debe retornar la lista de sanciones existente', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/disciplinas'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(Array.isArray(body.data)).toBe(true);
    });

    it('2. POST: Debe crear una sanción en la base de datos', async () => {
        const payload = {
            reason: "Sancion deportiva por patada en partido",
            start_date: '2026-05-23',
            end_date: '2026-06-23',
            is_total_suspension: false,
            member_id: testMemberId,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplinas',
            payload
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        
        expect(body.data.id).toBeDefined();
        expect(body.data.reason).toBe('Sancion deportiva por patada en partido');
        
        // Guardamos el ID para usarlo en el test PUT
        createdDisciplineId = body.data.id;
        
        // Verificamos si persistié realmente
        const dbDiscipline = await prisma.discipline.findUnique({ where: { id: createdDisciplineId } });
        expect(dbDiscipline).not.toBeNull();
    });

    it('3. POST: Debe retornar 400 si las fechas están invertidas', async () => {
        const payload = {
            reason: 'Sancion con fechas mal',
            start_date: '2026-08-15',
            end_date: '2026-08-01',  // anterior a start_date
            is_total_suspension: false,
            member_id: testMemberId,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplinas',
            payload
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('La fecha de inicio debe ser menor a la fecha de fin');
    });

    it('4. PUT: Debe actualizar la sancion modificando la bdd', async () => {
        const updatePayload = {
            reason: 'Sancion por incumplimiento de pagos'
        };

        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/disciplinas/${createdDisciplineId}`,
            payload: updatePayload
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.reason).toBe('Sancion por incumplimiento de pagos');

        // Verificar directamente en PostgreSQL que el campo se modificó
        const dbDiscipline = await prisma.discipline.findUnique({ where: { id: createdDisciplineId } });
        expect(dbDiscipline?.reason).toBe('Sancion por incumplimiento de pagos');
    });
    
});