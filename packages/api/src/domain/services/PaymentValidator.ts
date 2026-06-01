import { MemberRepository } from '../MemberRepository.js';
import { PaymentRepository } from '../PaymentRepository.js';

export class PaymentValidator {
    constructor(
        private readonly memberRepo: MemberRepository,
        private readonly paymentRepo: PaymentRepository
    ) {}

    async validateMemberExists(memberId: string): Promise<void> {
        const member = await this.memberRepo.findById(memberId);
        if (!member) {
            throw new Error('El socio indicado no existe');
        }
    }

    validateInvariants(amount: number, month: number, year: number): void {
        if (amount <= 0) {
            throw new Error('El monto del pago debe ser mayor a 0 (cero)');
        }
        if (month < 1 || month > 12) {
            throw new Error('El mes indicado no es válido');
        }
        
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 5;
        const maxYear = currentYear + 1;

        if (year < minYear || year > maxYear) {
            throw new Error('El año indicado no es válido');
        }
    }

    async validateNewPayment(
        memberId: string, 
        month: number, 
        year: number, 
        amount: number
    ): Promise<void> {
        await this.validateMemberExists(memberId);

        const duplicate = await this.paymentRepo.findByMemberMonthYearAndAmount(
            memberId, 
            month, 
            year, 
            amount
        );
        
        if (duplicate && duplicate.status !== 'Canceled') {
            throw new Error(`El socio ya tiene un pago de $${amount} registrado para el período ${month}/${year}`);
        }
    }
}
