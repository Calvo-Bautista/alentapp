import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

// Mocks de Repositorios
vi.mock('../infrastructure/PostgresPaymentRepository.js', () => {
    return {
        PostgresPaymentRepository: class {
            async findAll(memberId?: string) { return []; }
            async create(data: any) { return { id: 'p1', ...data }; }
            async findById(id: string) { return id === 'p1' ? { id: 'p1', status: 'Pending' } : null; }
            async findByMemberMonthYearAndAmount(m: string, mo: number, y: number, a: number) { return null; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete(id: string) { return; }
        }
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) { return id === 'm1' ? { id: 'm1', name: 'Socio Test' } : null; }
        }
    };
});

describe('Payment API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/payments (TDD-0010)', () => {
        it('debe retornar 201 y crear el pago correctamente', async () => {
            const payload = {
                month: 6,
                year: 2026,
                due_date: '2026-06-10',
                amount: 1500,
                member_id: 'm1'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBeDefined();
            expect(body.data.amount).toBe(1500);
        });

        it('debe retornar 400 si el monto es menor o igual a 0', async () => {
            const payload = {
                month: 6,
                year: 2026,
                due_date: '2026-06-10',
                amount: -50,
                member_id: 'm1'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El monto del pago debe ser mayor a 0 (cero)');
        });

        it('debe retornar 400 si el socio indicado no existe', async () => {
            const payload = {
                month: 6,
                year: 2026,
                due_date: '2026-06-10',
                amount: 1500,
                member_id: 'no-existe'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El socio indicado no existe');
        });
    });
});
