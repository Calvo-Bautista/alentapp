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
            throw new Error('El socio indicado no existe en el sistema');
        }
    }

    validateInvariants(amount: number, month: number, year: number): void {
        if (amount <= 0) {
            throw new Error('El monto del pago debe ser mayor a cero');
        }
        if (month < 1 || month > 12) {
            throw new Error('El mes debe estar comprendido entre 1 y 12');
        }
        
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 5;
        const maxYear = currentYear + 1;

        if (year < minYear || year > maxYear) {
            throw new Error(`El año del pago no es válido. Debe estar entre ${minYear} y ${maxYear}`);
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
