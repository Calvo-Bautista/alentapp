import { SportRepository } from '../domain/SportRepository.js';

export class DeleteSportUseCase {
    constructor(private readonly sportRepository: SportRepository) { }

    async execute(id: string): Promise<void> {
        // Verificar que el deporte exista antes de intentar borrarlo
        const existingSport = await this.sportRepository.findById(id);
        if (!existingSport) {
            throw new Error('El deporte no existe');
        }

        // Delegar la eliminación física al repositorio.
        await this.sportRepository.delete(id);
    }
}
