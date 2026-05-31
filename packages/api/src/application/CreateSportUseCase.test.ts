import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSportUseCase } from './CreateSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { CreateSportRequest } from '@alentapp/shared';

describe('CreateSportUseCase', () => {
    // Mocks de dependencias (Puertos y Servicios de Dominio)
    const mockSportRepo = {
        create: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateCapacity: vi.fn(),
        validateNameIsUnique: vi.fn(),
    } as unknown as SportValidator;

    const useCase = new CreateSportUseCase(mockSportRepo, mockSportValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un deporte exitosamente cuando los datos son válidos', async () => {
        const mockRequest: CreateSportRequest = {
            name: 'Tenis',
            description: 'Deporte de raqueta',
            max_capacity: 20,
            additional_price: 500,
            requires_medical_certificate: true,
        };

        vi.mocked(mockSportRepo.create).mockResolvedValueOnce({
            id: 'uuid-sport-1',
            ...mockRequest,
        });

        const result = await useCase.execute(mockRequest);

        expect(mockSportValidator.validateCapacity).toHaveBeenCalledWith(20);
        expect(mockSportValidator.validateNameIsUnique).toHaveBeenCalledWith('Tenis');
        expect(mockSportRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Tenis',
            max_capacity: 20,
        }));
        expect(result.id).toBe('uuid-sport-1');
        expect(result.name).toBe('Tenis');
    });

    it('debe lanzar un error si la capacidad es cero o negativa', async () => {
        const mockRequest: CreateSportRequest = {
            name: 'Natación',
            description: 'Deporte acuático',
            max_capacity: 0,
            additional_price: 300,
            requires_medical_certificate: false,
        };

        vi.mocked(mockSportValidator.validateCapacity).mockImplementationOnce(() => {
            throw new Error('La capacidad máxima debe ser mayor a 0');
        });

        await expect(useCase.execute(mockRequest)).rejects.toThrow(
            'La capacidad máxima debe ser mayor a 0',
        );
        expect(mockSportRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar un error si el nombre del deporte ya existe', async () => {
        const mockRequest: CreateSportRequest = {
            name: 'Tenis',
            description: 'Deporte duplicado',
            max_capacity: 10,
            additional_price: 200,
            requires_medical_certificate: false,
        };

        vi.mocked(mockSportValidator.validateCapacity).mockReturnValueOnce(undefined);
        vi.mocked(mockSportValidator.validateNameIsUnique).mockRejectedValueOnce(
            new Error('Ya existe un deporte con ese nombre'),
        );

        await expect(useCase.execute(mockRequest)).rejects.toThrow(
            'Ya existe un deporte con ese nombre',
        );
        expect(mockSportRepo.create).not.toHaveBeenCalled();
    });
});
