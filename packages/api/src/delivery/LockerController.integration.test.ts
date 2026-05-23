import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateLockerRequest } from '@alentapp/shared';

// Mockeamos el repositorio para que la API entera funcione sin conectarse a la DB real.
// Esto testea el ciclo completo: Fastify -> Controller -> UseCase -> Validator -> Repository (mock)
vi.mock('../infrastructure/PostgresLockerRepository.js', () => {
    return {
        PostgresLockerRepository: class {
            async findAll() {
                return [
                    {
                        id: 'locker-1',
                        number: 1,
                        location: 'Vestuario A',
                        status: 'Available',
                        member_id: null,
                        created_at: '2026-05-23T00:00:00.000Z',
                    },
                ];
            }
            async findById(id: string) {
                return id === 'locker-1'
                    ? {
                          id: 'locker-1',
                          number: 1,
                          location: 'Vestuario A',
                          status: 'Available',
                          member_id: null,
                          created_at: '2026-05-23T00:00:00.000Z',
                      }
                    : null;
            }
            async findByNumber(number: number) {
                return number === 1
                    ? {
                          id: 'locker-1',
                          number: 1,
                          location: 'Vestuario A',
                          status: 'Available',
                          member_id: null,
                          created_at: '2026-05-23T00:00:00.000Z',
                      }
                    : null;
            }
            async create(data: any) {
                return {
                    id: 'locker-new',
                    ...data,
                    created_at: '2026-05-23T00:00:00.000Z',
                };
            }
            async update(id: string, data: any) {
                return {
                    id,
                    number: data.number ?? 1,
                    location: data.location ?? 'Vestuario A',
                    status: data.status ?? 'Available',
                    member_id: data.member_id ?? null,
                    created_at: '2026-05-23T00:00:00.000Z',
                };
            }
            async delete(_id: string) {
                return;
            }
        },
    };
});

// Mockeamos también MemberRepository porque LockerValidator depende de él
vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findAll() { return []; }
            async findById(id: string) {
                return id === 'member-existente' ? { id: 'member-existente', name: 'Socio' } : null;
            }
            async findByDni() { return null; }
            async create(data: any) { return { id: 'm-1', ...data }; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete() { return; }
        },
    };
});

describe('Locker API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/lockers', () => {
        it('debe retornar código 200 y el listado de casilleros', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/lockers',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data[0].id).toBe('locker-1');
            expect(body.data[0].number).toBe(1);
        });
    });

    describe('POST /api/v1/lockers', () => {
        it('debe retornar 201 y crear el casillero atravesando todas las capas', async () => {
            const payload: CreateLockerRequest = {
                number: 99,
                location: 'Vestuario C',
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
            expect(body.data.id).toBe('locker-new');
            expect(body.data.number).toBe(99);
            expect(body.data.status).toBe('Available');
        });

        it('debe atravesar la validación y retornar 409 si el número ya está registrado', async () => {
            const payload: CreateLockerRequest = {
                number: 1, // Este número ya existe según nuestro mock
                location: 'Vestuario duplicado',
                status: 'Available',
                member_id: null,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload,
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ya existe un casillero con ese número');
        });
    });
});
