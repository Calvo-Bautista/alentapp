import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

// Mockeamos el repositorio de infraestructura para aislar la base de datos real.
vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async findAll() {
                return [
                    {
                        id: 'sport-1',
                        name: 'Fútbol',
                        description: 'Fútbol 11',
                        max_capacity: 22,
                        additional_price: 1500,
                        requires_medical_certificate: true,
                    },
                ];
            }
        },
    };
});

describe('Sport API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/sports', () => {
        it('debe retornar código 200 y el listado de deportes', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sports',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data).toHaveLength(1);
            expect(body.data[0].id).toBe('sport-1');
            expect(body.data[0].name).toBe('Fútbol');
        });
    });
});
