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

