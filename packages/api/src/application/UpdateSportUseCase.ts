import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO, UpdateSportRequest } from '@alentapp/shared';

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        // 1. Verificar que el deporte exista
        const existingSport = await this.sportRepository.findById(id);
        if (!existingSport) {
            throw new Error('El deporte no existe');
        }

        // 2. Regla de negocio: el nombre es inmutable (TDD-0017)
        // Aunque UpdateSportRequest no lo incluye en el tipo, rechazamos
        // explícitamente si alguien lo envía en tiempo de ejecución
        if ('name' in data) {
            throw new Error('El nombre del deporte es inmutable');
        }

        // 3. Si se envía max_capacity, validar que sea > 0
        if (data.max_capacity !== undefined) {
            this.sportValidator.validateCapacity(data.max_capacity);
        }

        // 4. Persistir los cambios permitidos
        return this.sportRepository.update(id, data);
    }
}
