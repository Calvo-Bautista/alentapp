import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, LockerStatus, UpdateLockerRequest } from '@alentapp/shared';

export class UpdateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator,
    ) {}

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        // 1. Verificar que el casillero exista
        const existing = await this.lockerRepository.findById(id);
        if (!existing) {
            throw new Error('El casillero no existe');
        }

        // 2. Si se cambia el número, validar que sea entero positivo y único
        if (data.number !== undefined) {
            this.lockerValidator.validateNumber(data.number);
            if (data.number !== existing.number) {
                await this.lockerValidator.validateNumberIsUnique(data.number, id);
            }
        }

        // 3. Si se asigna un socio (no null), validar que exista
        if (data.member_id) {
            await this.lockerValidator.validateMemberExists(data.member_id);
        }

        // 4. Calcular el member_id final: si vino en el request (incluso null), usarlo;
        //    si no, mantener el actual
        const finalMemberId = data.member_id !== undefined ? data.member_id : existing.member_id;

        // 5. Caso especial del TDD: pasar a Maintenance con socio aún asignado
        //    (el cliente no desasignó en el mismo request)
        if (data.status === 'Maintenance' && finalMemberId !== null) {
            throw new Error('Hay que desasignar al socio antes de pasar el casillero a mantenimiento');
        }

        // 6. Calcular status final:
        //    - Si llega status explícito, usarlo
        //    - Si cambia member_id sin status explícito, transicionar automáticamente
        //    - Si no, mantener el existente
        let finalStatus: LockerStatus;
        if (data.status !== undefined) {
            finalStatus = data.status;
        } else if (data.member_id !== undefined && data.member_id !== existing.member_id) {
            finalStatus = finalMemberId !== null ? 'Occupied' : 'Available';
        } else {
            finalStatus = existing.status;
        }

        // 7. Validar la combinación final status + member_id
        this.lockerValidator.validateStatusMemberCombination(finalStatus, finalMemberId);

        // 8. Persistir los cambios
        return this.lockerRepository.update(id, {
            ...(data.number !== undefined && { number: data.number }),
            ...(data.location !== undefined && { location: data.location }),
            status: finalStatus,
            member_id: finalMemberId,
        });
    }
}
