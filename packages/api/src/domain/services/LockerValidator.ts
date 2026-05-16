import { LockerStatus } from '@alentapp/shared';
import { LockerRepository } from '../LockerRepository.js';
import { MemberRepository } from '../MemberRepository.js';

// Servicio de Dominio: encapsula todas las reglas de negocio de Locker.

export class LockerValidator {
    constructor(
        private readonly lockerRepo: LockerRepository,
        private readonly memberRepo: MemberRepository,
    ) {}

    validateNumber(number: number): void {
        if (!Number.isInteger(number) || number <= 0) {
            throw new Error('El número de casillero debe ser un entero positivo');
        }
    }

    async validateNumberIsUnique(number: number, excludeLockerId?: string): Promise<void> {
        const existing = await this.lockerRepo.findByNumber(number);
        if (existing && existing.id !== excludeLockerId) {
            throw new Error('Ya existe un casillero con ese número');
        }
    }

    async validateMemberExists(memberId: string): Promise<void> {
        const member = await this.memberRepo.findById(memberId);
        if (!member) {
            throw new Error('El socio indicado no existe');
        }
    }

    // Las únicas combinaciones válidas son:
    //   - Available sin socio
    //   - Occupied con socio
    //   - Maintenance sin socio
    validateStatusMemberCombination(status: LockerStatus, memberId: string | null | undefined): void {
        const hasMember = memberId !== null && memberId !== undefined;
        if (status === 'Maintenance' && hasMember) {
            throw new Error('No se puede asignar un socio a un casillero en mantenimiento');
        }
        if (status === 'Available' && hasMember) {
            throw new Error('Un casillero disponible no puede tener un socio asignado');
        }
        if (status === 'Occupied' && !hasMember) {
            throw new Error('Un casillero ocupado debe tener un socio asignado');
        }
    }
}
