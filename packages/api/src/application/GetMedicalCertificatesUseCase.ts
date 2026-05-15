import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO } from '@alentapp/shared';

export class GetMedicalCertificatesUseCase {
    constructor(private readonly certRepo: MedicalCertificateRepository) {}

    async execute(memberId: string): Promise<MedicalCertificateDTO[]> {
        return this.certRepo.findByMemberId(memberId);
    }
}
