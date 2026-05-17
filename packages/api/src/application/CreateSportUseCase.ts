import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO, CreateSportRequest } from '@alentapp/shared';

export class CreateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(data: CreateSportRequest): Promise<SportDTO> {
        // 1. Validar regla de negocio: capacidad debe ser > 0
        this.sportValidator.validateCapacity(data.max_capacity);

        // 2. Validar que el nombre sea único
        await this.sportValidator.validateNameIsUnique(data.name);

        // 3. Persistir a través del puerto (sin conocer la implementación)
        const sport = await this.sportRepository.create({
            name: data.name,
            description: data.description,
            max_capacity: data.max_capacity,
            additional_price: data.additional_price,
            requires_medical_certificate: data.requires_medical_certificate,
        });

        return sport;
    }
}
