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

    
});