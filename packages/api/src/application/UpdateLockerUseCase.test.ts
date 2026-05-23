import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLockerUseCase } from './UpdateLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO } from '@alentapp/shared';

describe('UpdateLockerUseCase', () => {
    const mockLockerRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as LockerRepository;

    const mockLockerValidator = {
        validateNumber: vi.fn(),
        validateNumberIsUnique: vi.fn(),
        validateMemberExists: vi.fn(),
        validateStatusMemberCombination: vi.fn(),
    } as unknown as LockerValidator;

    const useCase = new UpdateLockerUseCase(mockLockerRepo, mockLockerValidator);

    // Casillero base que existe en la "DB" para los escenarios de edición
    const existingLocker: LockerDTO = {
        id: 'locker-1',
        number: 10,
        location: 'Vestuario A',
        status: 'Available',
        member_id: null,
        created_at: '2026-05-23T00:00:00.000Z',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe transicionar status a Occupied al asignar un socio sin enviar status explícito', async () => {
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(existingLocker);
        vi.mocked(mockLockerRepo.update).mockResolvedValueOnce({
            ...existingLocker,
            status: 'Occupied',
            member_id: 'member-99',
        });

        const result = await useCase.execute('locker-1', { member_id: 'member-99' });

        // Valida la existencia del socio recién asignado
        expect(mockLockerValidator.validateMemberExists).toHaveBeenCalledWith('member-99');

        // El UseCase debe deducir Occupied porque pasó de null → member-99
        expect(mockLockerValidator.validateStatusMemberCombination).toHaveBeenCalledWith('Occupied', 'member-99');
        expect(mockLockerRepo.update).toHaveBeenCalledWith('locker-1', expect.objectContaining({
            status: 'Occupied',
            member_id: 'member-99',
        }));

        expect(result.status).toBe('Occupied');
        expect(result.member_id).toBe('member-99');
    });

    it('debe rechazar el cambio a Maintenance si el casillero todavía tiene un socio asignado', async () => {
        // El casillero existente está Occupied con socio
        const occupiedLocker: LockerDTO = {
            ...existingLocker,
            status: 'Occupied',
            member_id: 'member-42',
        };
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(occupiedLocker);

        // Se intenta pasar a Maintenance sin desasignar al socio en el mismo request
        await expect(
            useCase.execute('locker-1', { status: 'Maintenance' }),
        ).rejects.toThrow('Hay que desasignar al socio antes de pasar el casillero a mantenimiento');

        // No debe persistir nada (TDD-0008)
        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });
});
