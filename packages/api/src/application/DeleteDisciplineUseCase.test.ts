import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDisciplineUseCase } from './DeleteDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('DeleteDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as DisciplineRepository;

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

    it('debe eliminar la sanción si existe', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(existingDiscipline);
        vi.mocked(mockDisciplineRepo.delete).mockResolvedValueOnce(undefined);

        await expect(useCase.execute("1")).resolves.toBeUndefined();

        expect(mockDisciplineRepo.findById).toHaveBeenCalledWith("1");
        expect(mockDisciplineRepo.delete).toHaveBeenCalledWith("1");
    })
})