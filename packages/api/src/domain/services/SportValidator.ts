import { SportRepository } from '../SportRepository.js';

// Servicio de Dominio: encapsula todas las reglas de negocio de Sport.

export class SportValidator {
    constructor(private readonly sportRepo: SportRepository) { }

    // El max_capacity debe ser estrictamente mayor a cero.
    validateCapacity(max_capacity: number): void {
        if (max_capacity <= 0) {
            throw new Error('La capacidad máxima debe ser mayor a 0');
        }
    }


    // El nombre del deporte debe ser único en el sistema.
    async validateNameIsUnique(name: string): Promise<void> {
        const existing = await this.sportRepo.findByName(name);
        if (existing) {
            throw new Error('Ya existe un deporte con ese nombre');
        }
    }
}
