import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { CreateLockerRequest, LockerDTO, LockerStatus } from '@alentapp/shared';

export class CreateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator,
    ) {}

    async execute(data: CreateLockerRequest): Promise<LockerDTO> {
        // 1. Validar que el número sea entero positivo
        this.lockerValidator.validateNumber(data.number);

        // 2. Validar que el número no esté ya registrado
        await this.lockerValidator.validateNumberIsUnique(data.number);

        // 3. Si se envió member_id, validar que el socio exista
        if (data.member_id) {
            await this.lockerValidator.validateMemberExists(data.member_id);
        }

        // 4. Deducir status si no se envió: Available sin socio, Occupied con socio
        const memberId = data.member_id ?? null;
        const status: LockerStatus = data.status ?? (memberId ? 'Occupied' : 'Available');

        // 5. Validar la combinación status + member_id
        this.lockerValidator.validateStatusMemberCombination(status, memberId);

        // 6. Persistir a través del puerto
        return this.lockerRepository.create({
            number: data.number,
            location: data.location,
            status,
            member_id: memberId,
        });
    }
}
