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
        validateDates: vi.fn(),
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

    it('debe lanzar error y no actualizar si la validación del nuevo socio falla', async () => {
        const updateData: UpdateDisciplineRequest = { member_id: 'socio-no-existe' };
        const errorMsg = 'No existe ese socio en el club';
        vi.mocked(mockDisciplineValidator.validateMemberExists).mockRejectedValueOnce(new Error(errorMsg));

        await expect(useCase.execute('sancion-1', updateData)).rejects.toThrow(errorMsg);

        expect(mockDisciplineValidator.validateMemberExists).toHaveBeenCalledWith('socio-no-existe');
        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe validar las fechas si start_date cambia y es diferente', async () => {
        const updateData: UpdateDisciplineRequest = { start_date: '2026-05-06' };
        vi.mocked(mockDisciplineValidator.validateDates).mockReturnValueOnce(undefined);
        vi.mocked(mockDisciplineRepo.update).mockResolvedValueOnce({ ...mockExistingDiscipline, ...updateData });

        await useCase.execute('sancion-1', updateData);

        expect(mockDisciplineValidator.validateDates).toHaveBeenCalledWith('2026-05-06', mockExistingDiscipline.end_date);
        expect(mockDisciplineRepo.update).toHaveBeenCalledWith('sancion-1', updateData);
    });

    it('debe validar las fechas si end_date cambia y es diferente', async () => {
        const updateData: UpdateDisciplineRequest = { end_date: '2026-06-20' };
        vi.mocked(mockDisciplineValidator.validateDates).mockReturnValueOnce(undefined);
        vi.mocked(mockDisciplineRepo.update).mockResolvedValueOnce({ ...mockExistingDiscipline, ...updateData });

        await useCase.execute('sancion-1', updateData);

        expect(mockDisciplineValidator.validateDates).toHaveBeenCalledWith(mockExistingDiscipline.start_date, '2026-06-20');
        expect(mockDisciplineRepo.update).toHaveBeenCalledWith('sancion-1', updateData);
    });

});
