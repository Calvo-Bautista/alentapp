import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateSportRequest } from '@alentapp/shared';

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

            async findByName(name: string) {
                if (name === 'Fútbol') {
                    return {
                        id: 'sport-1',
                        name: 'Fútbol',
                        description: 'Fútbol 11',
                        max_capacity: 22,
                        additional_price: 1500,
                        requires_medical_certificate: true,
                    };
                }
                return null;
            }

            async create(data: any) {
                return {
                    id: 'sport-new',
                    ...data,
                };
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

    describe('POST /api/v1/sports', () => {
        it('debe retornar 201 y crear el deporte con datos válidos', async () => {
            const payload: CreateSportRequest = {
                name: 'Tenis',
                description: 'Tenis de mesa',
                max_capacity: 4,
                additional_price: 500,
                requires_medical_certificate: false,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('sport-new');
            expect(body.data.name).toBe('Tenis');
            expect(body.data.max_capacity).toBe(4);
        });

        it('debe retornar 409 si el nombre de deporte ya existe', async () => {
            const payload: CreateSportRequest = {
                name: 'Fútbol', // Nombre que ya existe en el mock
                description: 'Otro fútbol',
                max_capacity: 10,
                additional_price: 800,
                requires_medical_certificate: true,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ya existe un deporte con ese nombre');
        });

        it('debe retornar 400 si la capacidad máxima es menor o igual a 0', async () => {
            const payload: CreateSportRequest = {
                name: 'Paddle',
                description: 'Paddle',
                max_capacity: 0, // Capacidad inválida
                additional_price: 600,
                requires_medical_certificate: false,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La capacidad máxima debe ser mayor a 0');
        });
    });
});
