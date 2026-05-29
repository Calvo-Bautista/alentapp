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
    });
});
