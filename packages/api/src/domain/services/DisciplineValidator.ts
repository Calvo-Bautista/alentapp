import { DisciplineRepository } from '../DisciplineRepository.js';
import { MemberRepository } from '../MemberRepository.js';

export class DisciplineValidator {
    constructor(private readonly disciplineRepo: DisciplineRepository, private readonly memberRepo: MemberRepository
    ) {}

    validateDates(startDate: Date, endDate: Date): void {
        const now = new Date();
        if (startDate < now) {
            throw new Error('La fecha de inicio no puede ser en el pasado');
        }
        if (endDate < startDate) {
            throw new Error('La fecha de inicio debe ser menor a la fecha de fin');
        }
        if (!endDate || !startDate) {
            throw new Error('La sanción debe tener un lapso de tiempo');
        }
    }

    // REVISAR FUNCION PQ NO SE SI FUNCIONA
    // haveTotal(isTotalSuspention: boolean): Boolean {
    //     if (!isTotalSuspention) {
    //         return false;
    //     }
    //     return true;
    // }

    async validateMemberExists(memberId: string): Promise<void> {
        const member = await this.memberRepo.findById(memberId);
        if (!memberId) {
            throw new Error('La sanción debe corresponder a un socio');
        }
        if (!member) {
            throw new Error('No existe ese socio en el club');
        }
    }
}