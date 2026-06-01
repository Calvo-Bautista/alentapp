import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemberRepository } from '../MemberRepository.js';
import { MedicalCertificateValidator } from './MedicalCertificateValidator.js';

describe('MedicalCertificateValidator', () => {
    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const validator = new MedicalCertificateValidator(mockMemberRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateDates', () => {
        beforeEach(() => {
            // FIX: Congelamos el tiempo del sistema a una fecha constante y controlada.
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-05-15T12:00:00Z'));
        });

        afterEach(() => {
            // Restauramos el tiempo real para no afectar otros tests de la suite
            vi.useRealTimers();
        });

        it('debe pasar si la fecha de emision es hoy (no futura)', () => {
            const today = '2025-05-15';
            const future = '2025-08-15';

            expect(() => validator.validateDates(today, future)).not.toThrow();
        });

        it('debe lanzar error si la fecha de emision es futura', () => {
            const tomorrow = '2025-05-16';
            const farFuture = '2025-08-16';

            expect(() => validator.validateDates(tomorrow, farFuture)).toThrow('La fecha de emision no puede ser futura');
        });

        it('debe pasar si la fecha de vencimiento es estrictamente posterior a la de emision', () => {
            expect(() => validator.validateDates('2025-01-01', '2025-06-01')).not.toThrow();
            expect(() => validator.validateDates('2025-03-15', '2025-03-16')).not.toThrow();
        });

        it('debe lanzar error si la fecha de vencimiento es igual o anterior a la de emision', () => {
            expect(() => validator.validateDates('2025-01-01', '2025-01-01')).toThrow('El vencimiento debe ser posterior a la emision');
            expect(() => validator.validateDates('2025-05-01', '2025-01-01')).toThrow('El vencimiento debe ser posterior a la emision');
        });
    });

    describe('validateMemberExists', () => {
        it('debe pasar si el socio existe y esta activo', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'socio-1', status: 'Activo' } as any);

            await expect(validator.validateMemberExists('socio-1')).resolves.not.toThrow();
            expect(mockMemberRepo.findById).toHaveBeenCalledWith('socio-1');
        });

        it('debe lanzar error si el socio no existe', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

            await expect(validator.validateMemberExists('socio-404')).rejects.toThrow('El socio indicado no existe');
            expect(mockMemberRepo.findById).toHaveBeenCalledWith('socio-404');
        });

        it('debe lanzar error si el socio existe pero no esta activo', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'socio-2', status: 'Moroso' } as any);

            await expect(validator.validateMemberExists('socio-2')).rejects.toThrow('El socio no se encuentra activo');
            expect(mockMemberRepo.findById).toHaveBeenCalledWith('socio-2');
        });
    });
});
