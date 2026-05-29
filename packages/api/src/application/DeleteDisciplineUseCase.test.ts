import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDisciplineUseCase } from './DeleteDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('DeleteDisciplineUseCase', () => {
    const mockDisciplineRepo = {

    } as unknown as DeleteDisciplineUseCase;

    const useCase = new DeleteDisciplineUseCase(mockDisciplineRepo);

    const existingDiscipline: DisciplineDTO = {
        id: "1",
        reason: "Sancion deportiva",
        start_date: "2026-05-23",
        end_date: "2026-06-23",
        is_total_suspension: true,
        member_id: "1",
    }

    beforeEach(() => {
        vi.clearAllMocks();
    });

    
});
