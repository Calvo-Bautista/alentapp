import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateDisciplineRequest } from '@alentapp/shared';

// Mockeamos el repositorio para que la API entera funcione sin conectarse a la DB real.
// Esto testea el ciclo completo: Fastify -> Controller -> UseCase -> Validator -> Repository (mock)
vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => {
    return {
        PostgresDisciplineRepository: class {
            async findAll() {
                return [
                    {
                        id: 'sancion-1',
                        reason: "Sancion deportiva",
                        start_date: '2026-05-23',
                        end_date: '2026-06-23',
                        is_total_suspension: false,
                        member_id: "socio-1",
                    },
                ];
            }
            async findById(id: string) {
                return id === 'sancion-1'
                    ? {
                          id: 'sancion-1',
                          reason: "Sancion deportiva",
                          start_date: '2026-05-23',
                          end_date: '2026-06-23',
                          is_total_suspension: false,
                          member_id: "socio-1",
                      }
                    : null;
            }
            async findByMemberId(memberId: string) {
                return memberId === "socio-1"
                    ? [{
                              id: 'sancion-1',
                              reason: "Sancion deportiva",
                              start_date: '2026-05-23',
                              end_date: '2026-06-23',
                              is_total_suspension: false,
                              member_id: "socio-1",
                      }]
                    : null;
            }
            async create(data: any) {
                return {
                    id: 'sancion-new',
                    ...data,
                };
            }
            async update(id: string, data: any) {
                return {
                    id,
                    reason: data.reason ?? "Sancion deportiva",
                    start_date: data.start_date ?? '2026-05-23',
                    end_date: data.end_date ?? '2026-06-23',
                    is_total_suspension: data.is_total_suspension ?? false,
                    member_id: data.member_id ?? "socio-1",
                };
            }
            async delete(_id: string) {
                return;
            }
        },
    };
});

// Mockeamos también MemberRepository porque DisciplineValidator depende de él
// para validar que el socio exista antes de crear/actualizar una sanción
vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findAll() { return []; }
            async findById(id: string) {
                return id === 'socio-1' ? { id: 'socio-1', name: 'Juan Perez' } : null;
            }
            async findByDni() { return null; }
            async create(data: any) { return { id: 'm-1', ...data }; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete() { return; }
        },
    };
});

describe('Discipline API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/disciplinas', () => {
        it('debe retornar código 200 y el listado de sanciones', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/disciplinas',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data[0].id).toBe('sancion-1');
            expect(body.data[0].reason).toBe('Sancion deportiva');
        });
    });

    describe('POST /api/v1/disciplinas', () => {
        it('debe retornar 201 y crear la sanción atravesando todas las capas', async () => {
            const payload: CreateDisciplineRequest = {
                reason: 'Conducta antideportiva',
                start_date: '2026-07-01',
                end_date: '2026-07-15',
                is_total_suspension: true,
                member_id: 'socio-1',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplinas',
                payload,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('sancion-new');
            expect(body.data.reason).toBe('Conducta antideportiva');
            expect(body.data.is_total_suspension).toBe(true);
        });
    
        it('debe retornar 400 si el socio no existe en el club', async () => {
            const payload: CreateDisciplineRequest = {
                reason: 'Conducta antideportiva',
                start_date: '2026-07-01',
                end_date: '2026-07-15',
                is_total_suspension: false,
                member_id: 'socio-inexistente',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplinas',
                payload,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('No existe ese socio en el club');
        });

        it('debe retornar 400 si la fecha de inicio es posterior a la de fin', async () => {
            const payload: CreateDisciplineRequest = {
                reason: 'Fechas invertidas',
                start_date: '2026-08-15',
                end_date: '2026-08-01',
                is_total_suspension: false,
                member_id: 'socio-1',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplinas',
                payload,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La fecha de inicio debe ser menor a la fecha de fin');
        });
    });

    describe('PUT /api/v1/disciplinas/:id', () => {
        it('debe retornar 200 y los datos actualizados al editar una sanción existente', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/disciplinas/sancion-1',
                payload: {
                    reason: 'Sancion modificada por reincidencia',
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('sancion-1');
            expect(body.data.reason).toBe('Sancion modificada por reincidencia');
        });
    });

    describe('DELETE /api/v1/disciplinas/:id', () => {
        it('debe retornar 204 sin cuerpo si la eliminación es exitosa', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplinas/sancion-1',
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });
    });    
});