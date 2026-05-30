import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDisciplineUseCase } from './UpdateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { UpdateDisciplineRequest, DisciplineDTO } from '@alentapp/shared';

describe('UpdateDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockDisciplineValidator = {
        validateMemberExists: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new UpdateDisciplineUseCase(mockDisciplineRepo, mockDisciplineValidator);

    const mockExistingDiscipline: DisciplineDTO = {
        id: 'sancion-1',
        reason: 'Sancion original',
        start_date: '2026-06-01',
        end_date: '2026-06-15',
        is_total_suspension: false,
        member_id: 'socio-1'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValue(mockExistingDiscipline);
    });

    

});
