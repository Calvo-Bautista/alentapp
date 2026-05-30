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

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear una sanción exitosamente si pasa las validaciones de negocio', async () => {
        vi.mocked(mockDisciplineValidator.validateDates).mockReturnValue(undefined);
        vi.mocked(mockDisciplineValidator.validateMemberExists).mockResolvedValue(undefined);
        vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce(mockResponse);

        const result = await useCase.execute(mockRequest);

        expect(mockDisciplineValidator.validateDates).toHaveBeenCalledWith(mockRequest.start_date, mockRequest.end_date);
        expect(mockDisciplineValidator.validateMemberExists).toHaveBeenCalledWith(mockRequest.member_id);
        expect(mockDisciplineRepo.create).toHaveBeenCalledWith(mockRequest);
        expect(result).toEqual(mockResponse);
    });

    it('debe lanzar un error si las fechas son inválidas y no persistir nada', async () => {
        const errorMsg = 'La fecha de inicio debe ser menor a la fecha de fin';
        vi.mocked(mockDisciplineValidator.validateDates).mockImplementationOnce(() => {
            throw new Error(errorMsg);
        });

        await expect(useCase.execute(mockRequest)).rejects.toThrow(errorMsg);

        expect(mockDisciplineValidator.validateDates).toHaveBeenCalledWith(mockRequest.start_date, mockRequest.end_date);
        expect(mockDisciplineValidator.validateMemberExists).not.toHaveBeenCalled();
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    
});
