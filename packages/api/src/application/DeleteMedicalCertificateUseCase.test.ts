import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteMedicalCertificateUseCase } from './DeleteMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO } from '@alentapp/shared';

describe('DeleteMedicalCertificateUseCase', () => {
    const mockCertRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const useCase = new DeleteMedicalCertificateUseCase(mockCertRepo);

    const mockExistingCertificate: MedicalCertificateDTO = {
        id: 'cert-1',
        member_id: 'socio-1',
        issue_date: '2025-01-01',
        expiry_date: '2025-06-01',
        doctor_license: 'MP-123',
        is_validated: true,
        created_at: '2025-01-01T00:00:00.000Z',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe eliminar el certificado si existe', async () => {
        vi.mocked(mockCertRepo.findById).mockResolvedValueOnce(mockExistingCertificate);
        vi.mocked(mockCertRepo.delete).mockResolvedValueOnce(undefined);

        await expect(useCase.execute('cert-1')).resolves.toBeUndefined();

        expect(mockCertRepo.findById).toHaveBeenCalledWith('cert-1');
        expect(mockCertRepo.delete).toHaveBeenCalledWith('cert-1');
    });

    it('debe lanzar error y no eliminar nada si el certificado no existe', async () => {
        vi.mocked(mockCertRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('cert-404')).rejects.toThrow('El certificado no existe');

        expect(mockCertRepo.delete).not.toHaveBeenCalled();
    });
});
