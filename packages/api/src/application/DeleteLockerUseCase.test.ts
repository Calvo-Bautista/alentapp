import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteLockerUseCase } from './DeleteLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO } from '@alentapp/shared';

describe('DeleteLockerUseCase', () => {
    const mockLockerRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as LockerRepository;

    const useCase = new DeleteLockerUseCase(mockLockerRepo);

    const existingLocker: LockerDTO = {
        id: 'locker-1',
        number: 5,
        location: 'Vestuario A',
        status: 'Available',
        member_id: null,
        created_at: '2026-05-23T00:00:00.000Z',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe eliminar el casillero si existe', async () => {
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(existingLocker);
        vi.mocked(mockLockerRepo.delete).mockResolvedValueOnce(undefined);

        await expect(useCase.execute('locker-1')).resolves.toBeUndefined();

        expect(mockLockerRepo.findById).toHaveBeenCalledWith('locker-1');
        expect(mockLockerRepo.delete).toHaveBeenCalledWith('locker-1');
    });
});
