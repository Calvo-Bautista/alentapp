import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared';

export class UpdateDisciplineUseCase {
    constructor(
        private readonly disciplineRepo: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator
    ) {}

    async execute(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
        // Validar existencia de la sanción
        const existingDiscipline = await this.disciplineRepo.findById(id);
        if (!existingDiscipline) {
            throw new Error('La sanción no existe');
        }

        // Validar que si se cambia el member, el member_id exista
        if (data.member_id && data.member_id !== existingDiscipline.member_id) {
            await this.disciplineValidator.validateMemberExists(data.member_id);
        }   

        // Validar que si se cambia la fecha de inicio, start_date sea menor a end_date
        if (data.start_date && data.start_date !== existingDiscipline.start_date) {
            await this.disciplineValidator.validateDates(data.start_date, existingDiscipline.end_date);
        }

        // Validar que si se cambia la fecha de fin, start_date sea menor a end_date
        if (data.end_date && data.end_date !== existingDiscipline.end_date) {
            await this.disciplineValidator.validateDates(existingDiscipline.start_date, data.end_date);
        }

        return this.disciplineRepo.update(id, data);
    }
}
