import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentValidator } from './PaymentValidator.js';
import { MemberRepository } from '../MemberRepository.js';
import { PaymentRepository } from '../PaymentRepository.js';

describe('PaymentValidator', () => {
    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockPaymentRepo = {
        findByMemberMonthYearAndAmount: vi.fn(),
    } as unknown as PaymentRepository;

    const validator = new PaymentValidator(mockMemberRepo, mockPaymentRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateInvariants', () => {
        it('1. debe lanzar error si el monto es 0', () => {
            expect(() => validator.validateInvariants(0, 5, 2026)).toThrow('El monto del pago debe ser mayor a 0 (cero)');
        });

        it('2. debe lanzar error si el monto es negativo', () => {
            expect(() => validator.validateInvariants(-100, 5, 2026)).toThrow('El monto del pago debe ser mayor a 0 (cero)');
        });

        it('3. debe lanzar error si el mes es menor a 1', () => {
            expect(() => validator.validateInvariants(1000, 0, 2026)).toThrow('El mes indicado no es válido');
        });

        it('4. debe lanzar error si el mes es mayor a 12', () => {
            expect(() => validator.validateInvariants(1000, 13, 2026)).toThrow('El mes indicado no es válido');
        });

        it('5. debe lanzar error si el año es muy antiguo', () => {
            const currentYear = new Date().getFullYear();
            expect(() => validator.validateInvariants(1000, 5, currentYear - 6)).toThrow('El año indicado no es válido');
        });

        it('6. debe lanzar error si el año es muy a futuro', () => {
            const currentYear = new Date().getFullYear();
            expect(() => validator.validateInvariants(1000, 5, currentYear + 2)).toThrow('El año indicado no es válido');
        });

        it('7. debe pasar si los datos son válidos', () => {
            const currentYear = new Date().getFullYear();
            expect(() => validator.validateInvariants(1500.50, 12, currentYear)).not.toThrow();
        });
    });

    describe('validateMemberExists', () => {
        it('8. debe pasar si el socio existe', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'member-1', name: 'Juan' } as any);
            await expect(validator.validateMemberExists('member-1')).resolves.not.toThrow();
        });

        it('9. debe lanzar error si el socio no existe', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);
            await expect(validator.validateMemberExists('non-existent')).rejects.toThrow('El socio indicado no existe');
        });
    });

    describe('validateNewPayment', () => {
        it('10. debe lanzar error si ya existe un pago idéntico activo', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'member-1' } as any);
            vi.mocked(mockPaymentRepo.findByMemberMonthYearAndAmount).mockResolvedValueOnce({ 
                id: 'pay-1', 
                status: 'Pending' 
            } as any);

            await expect(validator.validateNewPayment('member-1', 5, 2026, 1000))
                .rejects.toThrow('El socio ya tiene un pago de $1000 registrado para el período 5/2026');
        });

        it('11. debe pasar si existe un pago idéntico pero está cancelado', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'member-1' } as any);
            vi.mocked(mockPaymentRepo.findByMemberMonthYearAndAmount).mockResolvedValueOnce({ 
                id: 'pay-1', 
                status: 'Canceled' 
            } as any);

            await expect(validator.validateNewPayment('member-1', 5, 2026, 1000)).resolves.not.toThrow();
        });

        it('12. debe pasar si no existe un pago previo para ese período', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'member-1' } as any);
            vi.mocked(mockPaymentRepo.findByMemberMonthYearAndAmount).mockResolvedValueOnce(null);

            await expect(validator.validateNewPayment('member-1', 5, 2026, 1000)).resolves.not.toThrow();
        });
    });
});
