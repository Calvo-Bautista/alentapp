import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportValidator } from './SportValidator.js';
import { SportRepository } from '../SportRepository.js';

describe('SportValidator', () => {
    const mockSportRepo = {
        findByName: vi.fn(),
    } as unknown as SportRepository;

    const validator = new SportValidator(mockSportRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateCapacity', () => {
        it('debe pasar correctamente si la capacidad es mayor a 0', () => {
            expect(() => validator.validateCapacity(10)).not.toThrow();
        });

        it('debe lanzar un error si la capacidad es menor o igual a 0', () => {
            expect(() => validator.validateCapacity(0)).toThrow('La capacidad máxima debe ser mayor a 0');
            expect(() => validator.validateCapacity(-5)).toThrow('La capacidad máxima debe ser mayor a 0');
        });
    });

    describe('validateNameIsUnique', () => {
        it('debe pasar si el nombre no está registrado en la base de datos', async () => {
            vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce(null);

            await expect(validator.validateNameIsUnique('Fútbol')).resolves.not.toThrow();
            expect(mockSportRepo.findByName).toHaveBeenCalledWith('Fútbol');
        });

        it('debe lanzar un error si el nombre ya existe', async () => {
            vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce({
                id: 'uuid-sport-1',
                name: 'Fútbol',
                description: 'Deporte rey',
                max_capacity: 22,
                additional_price: 0,
                requires_medical_certificate: false,
            });

            await expect(validator.validateNameIsUnique('Fútbol')).rejects.toThrow('Ya existe un deporte con ese nombre');
            expect(mockSportRepo.findByName).toHaveBeenCalledWith('Fútbol');
        });
    });
});
