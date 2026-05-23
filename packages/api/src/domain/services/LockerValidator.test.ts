import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockerValidator } from './LockerValidator.js';
import { LockerRepository } from '../LockerRepository.js';
import { MemberRepository } from '../MemberRepository.js';

describe('LockerValidator', () => {
    // Mocks de los repositorios para aislar el test de la Base de Datos
    const mockLockerRepo = {
        findByNumber: vi.fn(),
    } as unknown as LockerRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const validator = new LockerValidator(mockLockerRepo, mockMemberRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateNumber', () => {
        it('debe pasar correctamente si el número es un entero positivo', () => {
            expect(() => validator.validateNumber(1)).not.toThrow();
            expect(() => validator.validateNumber(42)).not.toThrow();
            expect(() => validator.validateNumber(9999)).not.toThrow();
        });

        it('debe lanzar un error si el número es 0, negativo o no entero', () => {
            expect(() => validator.validateNumber(0)).toThrow('El número de casillero debe ser un entero positivo');
            expect(() => validator.validateNumber(-5)).toThrow('El número de casillero debe ser un entero positivo');
            expect(() => validator.validateNumber(3.14)).toThrow('El número de casillero debe ser un entero positivo');
        });
    });

    describe('validateNumberIsUnique', () => {
        it('debe pasar si el número no está registrado en la base de datos', async () => {
            vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce(null);

            await expect(validator.validateNumberIsUnique(15)).resolves.not.toThrow();
            expect(mockLockerRepo.findByNumber).toHaveBeenCalledWith(15);
        });

        it('debe pasar si el número existe pero pertenece al mismo casillero (caso de edición)', async () => {
            vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce({ id: 'locker-1', number: 15 } as any);

            await expect(validator.validateNumberIsUnique(15, 'locker-1')).resolves.not.toThrow();
        });

        it('debe lanzar error si el número pertenece a otro casillero distinto', async () => {
            vi.mocked(mockLockerRepo.findByNumber).mockResolvedValueOnce({ id: 'locker-2', number: 15 } as any);

            await expect(validator.validateNumberIsUnique(15, 'locker-1')).rejects.toThrow('Ya existe un casillero con ese número');
        });
    });

    describe('validateStatusMemberCombination', () => {
        it('debe aceptar las combinaciones válidas: Available sin socio, Occupied con socio, Maintenance sin socio', () => {
            expect(() => validator.validateStatusMemberCombination('Available', null)).not.toThrow();
            expect(() => validator.validateStatusMemberCombination('Occupied', 'member-1')).not.toThrow();
            expect(() => validator.validateStatusMemberCombination('Maintenance', null)).not.toThrow();
        });

        it('debe rechazar las combinaciones inválidas con el mensaje correspondiente', () => {
            expect(() => validator.validateStatusMemberCombination('Maintenance', 'member-1'))
                .toThrow('No se puede asignar un socio a un casillero en mantenimiento');
            expect(() => validator.validateStatusMemberCombination('Available', 'member-1'))
                .toThrow('Un casillero disponible no puede tener un socio asignado');
            expect(() => validator.validateStatusMemberCombination('Occupied', null))
                .toThrow('Un casillero ocupado debe tener un socio asignado');
        });
    });
});
