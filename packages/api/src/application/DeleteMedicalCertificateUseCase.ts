import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

export class DeleteMedicalCertificateUseCase {
    constructor(private readonly certRepo: MedicalCertificateRepository) {}

    async execute(id: string): Promise<void> {
        // 1. Verificamos que el certificado existe
        const existing = await this.certRepo.findById(id);
        if (!existing) {
            throw new Error('El certificado no existe');
        }

        // 2. Ejecutamos la eliminacion
        await this.certRepo.delete(id);
    }
}
