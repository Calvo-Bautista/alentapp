import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

export class GetDisciplineUseCase {
    constructor(private readonly disciplineRepo: DisciplineRepository) {}

    async getAll(): Promise<DisciplineDTO[]> {
        return this.disciplineRepo.findAll();
    }

    async getById(id: string): Promise<DisciplineDTO> {
        const discipline = await this.disciplineRepo.findById(id);
        if (!discipline) {
            throw new Error('La sanción no existe');
        }
        return discipline;
    }

    async getByMemberId(memberId: string): Promise<DisciplineDTO[]> {
        if (!memberId) {
            throw new Error('El ID del socio es requerido');
        }
        const disciplines = await this.disciplineRepo.findByMemberId(memberId);
        return disciplines ?? [];
    }

}