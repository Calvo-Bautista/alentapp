import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDisciplineUseCase } from './CreateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { CreateDisciplineRequest, DisciplineDTO } from '@alentapp/shared';

describe('CreateDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        create: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockDisciplineValidator = {
        validateDates: vi.fn(),
        validateMemberExists: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new CreateDisciplineUseCase(mockDisciplineRepo, mockDisciplineValidator);

    const mockRequest: CreateDisciplineRequest = {
        reason: 'Mal comportamiento',
        start_date: '2026-06-01',
        end_date: '2026-06-15',
        is_total_suspension: false,
        member_id: 'socio-123'
    };

    const mockResponse: DisciplineDTO = {
        id: 'sancion-abc',
        ...mockRequest
    };

    
});
