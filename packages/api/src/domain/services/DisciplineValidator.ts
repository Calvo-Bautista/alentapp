import { DisciplineRepository } from '../DisciplineRepository.js';
import { MemberRepository } from '../MemberRepository.js';

export class DisciplineValidator {
    constructor(private readonly disciplineRepo: DisciplineRepository, private readonly memberRepo: MemberRepository
    ) {}

    validateDates(startDate: string, endDate: string): void {
        if (!endDate || !startDate) {
            throw new Error('La sanción debe tener un lapso de tiempo');
        }

        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start < now) {
            throw new Error('La fecha de inicio no puede ser en el pasado');
        }
        if (end < start) {
            throw new Error('La fecha de inicio debe ser menor a la fecha de fin');
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
        if (!member) {
            throw new Error('No existe ese socio en el club');
        }
    }
}