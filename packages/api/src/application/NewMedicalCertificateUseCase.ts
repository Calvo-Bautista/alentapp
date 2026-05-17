import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { MedicalCertificateDTO, CreateMedicalCertificateRequest } from '@alentapp/shared';

export class CreateMedicalCertificateUseCase {
    constructor(
        private readonly certificateRepo: MedicalCertificateRepository,
        private readonly validator: MedicalCertificateValidator
    ) {}

    async execute(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
        // 1. Validaciones de negocio(fechas validas y miembro activo)
        this.validator.validateDates(data.issue_date, data.expiry_date);
        await this.validator.validateMemberExists(data.member_id);

        // 2. Invalidar certificados anteriores del mismo socio
        await this.certificateRepo.invalidateByMemberId(data.member_id);

        // 3. Crear el nuevo certificado (se crea validado)
        const nuevoCertificado = await this.certificateRepo.create({
            member_id: data.member_id,
            issue_date: data.issue_date,
            expiry_date: data.expiry_date,
            doctor_license: data.doctor_license,
            is_validated: true,
            created_at: new Date().toISOString(),
        });

        return nuevoCertificado;
    }
}
