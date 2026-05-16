import { MemberRepository } from '../MemberRepository.js';

export class MedicalCertificateValidator {
    constructor(private readonly memberRepo: MemberRepository) {}

    validateDates(issueDate: string, expiryDate: string): void {
        const issue = new Date(issueDate);
        const expiry = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (issue > today) {
            throw new Error('La fecha de emision no puede ser futura');
        }

        if (expiry <= issue) {
            throw new Error('El vencimiento debe ser posterior a la emision');
        }
    }

    async validateMemberExists(memberId: string): Promise<void> {
        const member = await this.memberRepo.findById(memberId);

        if (!member) {
            throw new Error('El socio indicado no existe');
        }

        if (member.status !== 'Activo') {
            throw new Error('El socio no se encuentra activo');
        }
    }
}


