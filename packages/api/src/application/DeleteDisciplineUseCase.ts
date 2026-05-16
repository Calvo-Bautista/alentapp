import { DisciplineRepository } from '../domain/DisciplineRepository.js';

export class DeleteMemberUseCase {
    constructor(private readonly disciplineRepository: DisciplineRepository) {}

    async execute(id: string): Promise<void> {
        // Validar existencia del miembro
        const existingDiscipline = await this.disciplineRepository.findById(id);
        if (!existingDiscipline) {
            throw new Error('La sanción no existe');
        }

        // Ejecutar eliminación
        await this.disciplineRepository.delete(id);
    }
}


