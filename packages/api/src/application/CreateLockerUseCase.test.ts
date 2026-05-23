import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLockerUseCase } from './CreateLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { CreateLockerRequest } from '@alentapp/shared';

describe('CreateLockerUseCase', () => {
    // 1. Mocks de las dependencias (Puerto y Servicio de Dominio)
    const mockLockerRepo = {
        create: vi.fn(),
    } as unknown as LockerRepository;

    const mockLockerValidator = {
        validateNumber: vi.fn(),
        validateNumberIsUnique: vi.fn(),
        validateMemberExists: vi.fn(),
        validateStatusMemberCombination: vi.fn(),
    } as unknown as LockerValidator;

    // 2. Instanciamos el caso de uso inyectando los mocks
    const useCase = new CreateLockerUseCase(mockLockerRepo, mockLockerValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un casillero Available sin socio cuando se envía status explícito', async () => {
        const mockRequest: CreateLockerRequest = {
            number: 42,
            location: 'Vestuario A - Pasillo 1',
            status: 'Available',
            member_id: null,
        };

        vi.mocked(mockLockerRepo.create).mockResolvedValueOnce({
            id: 'locker-1',
            ...mockRequest,
            status: 'Available',
            created_at: '2026-05-23T00:00:00.000Z',
        });

        const result = await useCase.execute(mockRequest);

        // Validaciones de negocio invocadas
        expect(mockLockerValidator.validateNumber).toHaveBeenCalledWith(42);
        expect(mockLockerValidator.validateNumberIsUnique).toHaveBeenCalledWith(42);
        // No se envió member_id, por lo tanto no se valida existencia del socio
        expect(mockLockerValidator.validateMemberExists).not.toHaveBeenCalled();
        expect(mockLockerValidator.validateStatusMemberCombination).toHaveBeenCalledWith('Available', null);

        // Persistencia con los datos correctos
        expect(mockLockerRepo.create).toHaveBeenCalledWith({
            number: 42,
            location: 'Vestuario A - Pasillo 1',
            status: 'Available',
            member_id: null,
        });

        expect(result.id).toBe('locker-1');
        expect(result.status).toBe('Available');
    });
});
