import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

export class CreateDisciplineUseCase {
    constructor(
        private readonly DisciplineRepository: DisciplineRepository,
        private readonly DisciplineValidator: DisciplineValidator
    ) {}

    async execute(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        // 1. Validaciones de negocio (centralizadas)
        this.DisciplineValidator.validateDates(data.start_date, data.end_date);
        await this.DisciplineValidator.validateMemberExists(data.member_id);

        // 2. Persistencia a través de la interfaz (sin saber qué DB es)
        const nuevaSancion = await this.DisciplineRepository.create(data)
        return nuevaSancion;
    }
}