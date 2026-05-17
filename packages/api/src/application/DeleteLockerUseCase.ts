import { LockerRepository } from '../domain/LockerRepository.js';

export class DeleteLockerUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(id: string): Promise<void> {
        const existing = await this.lockerRepository.findById(id);
        if (!existing) {
            throw new Error('El casillero no existe');
        }

        await this.lockerRepository.delete(id);
    }
}
