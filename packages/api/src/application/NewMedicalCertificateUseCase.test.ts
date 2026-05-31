import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateMedicalCertificateUseCase } from './NewMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { CreateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';

describe('CreateMedicalCertificateUseCase', () => {
    const mockCertRepo = {
        create: vi.fn(),
        invalidateByMemberId: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const mockValidator = {
        validateDates: vi.fn(),
        validateMemberExists: vi.fn(),
    } as unknown as MedicalCertificateValidator;

    const useCase = new CreateMedicalCertificateUseCase(mockCertRepo, mockValidator);

    const mockRequest: CreateMedicalCertificateRequest = {
        member_id: 'socio-1',
        issue_date: '2025-01-15',
        expiry_date: '2025-07-15',
        doctor_license: 'MP-12345',
    };

    const mockResponse: MedicalCertificateDTO = {
        id: 'cert-abc',
        member_id: 'socio-1',
        issue_date: '2025-01-15',
        expiry_date: '2025-07-15',
        doctor_license: 'MP-12345',
        is_validated: true,
        created_at: '2025-01-15T00:00:00.000Z',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un certificado exitosamente invalidando los anteriores del mismo socio', async () => {
        vi.mocked(mockValidator.validateDates).mockReturnValue(undefined);
        vi.mocked(mockValidator.validateMemberExists).mockResolvedValue(undefined);
        vi.mocked(mockCertRepo.invalidateByMemberId).mockResolvedValue(undefined);
        vi.mocked(mockCertRepo.create).mockResolvedValueOnce(mockResponse);

        const result = await useCase.execute(mockRequest);

        expect(mockValidator.validateDates).toHaveBeenCalledWith(mockRequest.issue_date, mockRequest.expiry_date);
        expect(mockValidator.validateMemberExists).toHaveBeenCalledWith(mockRequest.member_id);
        expect(mockCertRepo.invalidateByMemberId).toHaveBeenCalledWith(mockRequest.member_id);
        expect(mockCertRepo.create).toHaveBeenCalled();
        expect(result).toEqual(mockResponse);
    });

    it('debe lanzar error si las fechas son invalidas y no persistir nada', async () => {
        const errorMsg = 'El vencimiento debe ser posterior a la emision';
        vi.mocked(mockValidator.validateDates).mockImplementationOnce(() => {
            throw new Error(errorMsg);
        });

        await expect(useCase.execute(mockRequest)).rejects.toThrow(errorMsg);

        expect(mockValidator.validateDates).toHaveBeenCalledWith(mockRequest.issue_date, mockRequest.expiry_date);
        expect(mockValidator.validateMemberExists).not.toHaveBeenCalled();
        expect(mockCertRepo.invalidateByMemberId).not.toHaveBeenCalled();
        expect(mockCertRepo.create).not.toHaveBeenCalled();
    });
});
