import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

// Mockeamos el repositorio para aislar la integracion de la DB
vi.mock('../infrastructure/PostgresMedicalCertificateRepository.js', () => {
    return {
        PostgresMedicalCertificateRepository: class {
            async findByMemberId(memberId: string) {
                return memberId === 'socio-1'
                    ? [
                          {
                              id: 'cert-1',
                              member_id: 'socio-1',
                              issue_date: '2025-01-01',
                              expiry_date: '2025-06-01',
                              doctor_license: 'MP-123',
                              is_validated: true,
                              created_at: '2025-01-01T00:00:00.000Z',
                          },
                      ]
                    : [];
            }
            async findById(id: string) {
                return id === 'cert-1'
                    ? {
                          id: 'cert-1',
                          member_id: 'socio-1',
                          issue_date: '2025-01-01',
                          expiry_date: '2025-06-01',
                          doctor_license: 'MP-123',
                          is_validated: true,
                          created_at: '2025-01-01T00:00:00.000Z',
                      }
                    : null;
            }
            async invalidateByMemberId(_memberId: string) {
                return;
            }
            async create(data: any) {
                return {
                    id: 'cert-new',
                    ...data,
                    is_validated: true,
                    created_at: '2025-02-01T00:00:00.000Z',
                };
            }
            async update(id: string, data: any) {
                return {
                    id,
                    member_id: 'socio-1',
                    issue_date: data.issue_date ?? '2025-01-01',
                    expiry_date: data.expiry_date ?? '2025-06-01',
                    doctor_license: data.doctor_license ?? 'MP-123',
                    is_validated: data.is_validated ?? true,
                    created_at: '2025-01-01T00:00:00.000Z',
                };
            }
            async delete(_id: string) {
                return;
            }
        },
    };
});

// Mockeamos también MemberRepository porque MedicalCertificateValidator depende de él
vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findAll() { return []; }
            async findById(id: string) {
                if (id === 'socio-1') return { id: 'socio-1', name: 'Juan Perez', status: 'Activo' };
                if (id === 'socio-inactivo') return { id: 'socio-inactivo', name: 'Pedro', status: 'Moroso' };
                return null;
            }
            async findByDni() { return null; }
            async create(data: any) { return { id: 'm-1', ...data }; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete() { return; }
        },
    };
});

describe('MedicalCertificate API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/medical-certificates/:memberId', () => {
        it('debe retornar 200 y el listado de certificados de un socio', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/medical-certificates/socio-1',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data[0].id).toBe('cert-1');
            expect(body.data[0].doctor_license).toBe('MP-123');
        });
    });
});
