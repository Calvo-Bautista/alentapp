import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateMedicalCertificateUseCase } from './UpdateMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { UpdateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';

describe('UpdateMedicalCertificateUseCase', () => {
    const mockCertRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const mockCertValidator = {
        validateDates: vi.fn(),
    } as unknown as MedicalCertificateValidator;

    const useCase = new UpdateMedicalCertificateUseCase(mockCertRepo, mockCertValidator);

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
        vi.mocked(mockCertRepo.findById).mockResolvedValue(mockExistingCertificate);
    });

    it('debe lanzar error al actualizar si el certificado no existe y no llamar a update', async () => {
        vi.mocked(mockCertRepo.findById).mockResolvedValueOnce(null);

        const updateData: UpdateMedicalCertificateRequest = { doctor_license: 'MP-456' };
        await expect(useCase.execute('cert-404', updateData)).rejects.toThrow('El certificado no existe');

        expect(mockCertRepo.findById).toHaveBeenCalledWith('cert-404');
        expect(mockCertRepo.update).not.toHaveBeenCalled();
    });

    it('debe validar las fechas si issue_date cambia', async () => {
        const updateData: UpdateMedicalCertificateRequest = { issue_date: '2025-02-01' };
        vi.mocked(mockCertValidator.validateDates).mockReturnValueOnce(undefined);
        vi.mocked(mockCertRepo.update).mockResolvedValueOnce({ ...mockExistingCertificate, ...updateData });

        await useCase.execute('cert-1', updateData);

        expect(mockCertValidator.validateDates).toHaveBeenCalledWith('2025-02-01', mockExistingCertificate.expiry_date);
        expect(mockCertRepo.update).toHaveBeenCalledWith('cert-1', updateData);
    });
});
