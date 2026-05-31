import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDisciplineUseCase } from './GetDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('GetDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        findAll: vi.fn(),
        findById: vi.fn(),
        findByMemberId: vi.fn(),
    } as unknown as DisciplineRepository;

    const useCase = new GetDisciplineUseCase(mockDisciplineRepo);

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

    it('debe retornar la lista de sanciones', async () => {
        const mockDiscipline = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
        vi.mocked(mockDisciplineRepo.findAll).mockResolvedValueOnce(mockDiscipline as any);
        
        const result = await useCase.getAll();
        expect(result).toEqual(mockDiscipline);
        expect(mockDisciplineRepo.findAll).toHaveBeenCalledOnce();
    });

    it('debe retornar una sancion', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(existingDiscipline);

        const result = await useCase.getById("1");

        expect(result).toEqual(existingDiscipline);
        expect(mockDisciplineRepo.findById).toHaveBeenCalledWith("1");
    });


    it('debe lanzar un error si la sanción no existe', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.getById("999")).rejects.toThrow('La sanción no existe');
    });

    it('debe retornar las sanciones de un socio', async () => {
        const mockDisciplines = [existingDiscipline];
        vi.mocked(mockDisciplineRepo.findByMemberId).mockResolvedValueOnce(mockDisciplines);

        const result = await useCase.getByMemberId("1");

        expect(result).toEqual(mockDisciplines);
        expect(mockDisciplineRepo.findByMemberId).toHaveBeenCalledWith("1");
    });

    it('debe retornar un arreglo vacío si el repositorio retorna null (sin sanciones)', async () => {
        vi.mocked(mockDisciplineRepo.findByMemberId).mockResolvedValueOnce(null as any);

        const result = await useCase.getByMemberId("2");

        expect(result).toEqual([]);
        expect(mockDisciplineRepo.findByMemberId).toHaveBeenCalledWith("2");
    });

    it('debe lanzar un error si no se provee el ID del socio', async () => {
        await expect(useCase.getByMemberId("")).rejects.toThrow('El ID del socio es requerido');
    });
});