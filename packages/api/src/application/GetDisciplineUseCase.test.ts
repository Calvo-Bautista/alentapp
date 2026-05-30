import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDisciplineUseCase } from './GetDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';

describe('GetDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        findAll: vi.fn(),
    } as unknown as DisciplineRepository;

    const useCase = new GetDisciplineUseCase(mockDisciplineRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar la lista de sanciones', async () => {
        const mockDiscipline = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
        vi.mocked(mockDisciplineRepo.findAll).mockResolvedValueOnce(mockDiscipline as any);
        
        const result = await useCase.getAll();
        expect(result).toEqual(mockDiscipline);
        expect(mockDisciplineRepo.findAll).toHaveBeenCalledOnce();
    });
});