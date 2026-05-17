import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { MedicalCertificateDTO, UpdateMedicalCertificateRequest } from '@alentapp/shared';

export class UpdateMedicalCertificateUseCase {
    constructor(
        private readonly certRepo: MedicalCertificateRepository,
        private readonly certValidator: MedicalCertificateValidator,
    ) {}

    async execute(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
        // 1. Verificar que el certificado existe
        const existing = await this.certRepo.findById(id);
        if (!existing) {
            throw new Error('El certificado no existe');
        }

        // 2. Validar fechas si se envian cambios
        const finalIssueDate = data.issue_date ?? existing.issue_date;
        const finalExpiryDate = data.expiry_date ?? existing.expiry_date;

        if (data.issue_date || data.expiry_date) {
            this.certValidator.validateDates(finalIssueDate, finalExpiryDate);
        }

        // 3. Actualizar
        return this.certRepo.update(id, data);
    }
}
