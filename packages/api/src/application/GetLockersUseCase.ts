import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO } from '@alentapp/shared';

export class GetLockersUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(): Promise<LockerDTO[]> {
        return this.lockerRepository.findAll();
    }
}
