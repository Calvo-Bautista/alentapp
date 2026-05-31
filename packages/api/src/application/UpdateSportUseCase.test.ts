import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSportUseCase } from './UpdateSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO, UpdateSportRequest } from '@alentapp/shared';

describe('UpdateSportUseCase', () => {
    const existingSport: SportDTO = {
        id: 'uuid-sport-1',
        name: 'Tenis',
        description: 'Deporte de raqueta',
        max_capacity: 20,
        additional_price: 500,
        requires_medical_certificate: true,
    };

    const mockSportRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateCapacity: vi.fn(),
    } as unknown as SportValidator;

    const useCase = new UpdateSportUseCase(mockSportRepo, mockSportValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe actualizar description y max_capacity exitosamente', async () => {
        const payload: UpdateSportRequest = {
            description: 'Descripción actualizada',
            max_capacity: 30,
        };

        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);
        vi.mocked(mockSportRepo.update).mockResolvedValueOnce({
            ...existingSport,
            ...payload,
        });

        const result = await useCase.execute('uuid-sport-1', payload);

        expect(mockSportRepo.findById).toHaveBeenCalledWith('uuid-sport-1');
        expect(mockSportValidator.validateCapacity).toHaveBeenCalledWith(30);
        expect(mockSportRepo.update).toHaveBeenCalledWith('uuid-sport-1', payload);
        expect(result.description).toBe('Descripción actualizada');
        expect(result.max_capacity).toBe(30);
    });

    it('debe lanzar un error si el deporte no existe', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);

        await expect(
            useCase.execute('id-inexistente', { description: 'algo' }),
        ).rejects.toThrow('El deporte no existe');

        expect(mockSportRepo.update).not.toHaveBeenCalled();
    });

    it('debe rechazar el payload si incluye el campo name (nombre inmutable)', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);

        // Simulamos que alguien envía 'name' en tiempo de ejecución
        const payloadConName = { name: 'NuevoNombre', description: 'algo' } as any;

        await expect(
            useCase.execute('uuid-sport-1', payloadConName),
        ).rejects.toThrow('El nombre del deporte es inmutable');

        expect(mockSportRepo.update).not.toHaveBeenCalled();
    });

    it('debe rechazar si el nuevo max_capacity es cero o negativo', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);
        vi.mocked(mockSportValidator.validateCapacity).mockImplementationOnce(() => {
            throw new Error('La capacidad máxima debe ser mayor a 0');
        });

        await expect(
            useCase.execute('uuid-sport-1', { max_capacity: 0 }),
        ).rejects.toThrow('La capacidad máxima debe ser mayor a 0');

        expect(mockSportRepo.update).not.toHaveBeenCalled();
    });

    it('no debe llamar a validateCapacity si max_capacity no viene en el payload', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);
        vi.mocked(mockSportRepo.update).mockResolvedValueOnce({
            ...existingSport,
            description: 'Solo descripción',
        });

        await useCase.execute('uuid-sport-1', { description: 'Solo descripción' });

        expect(mockSportValidator.validateCapacity).not.toHaveBeenCalled();
    });
});
