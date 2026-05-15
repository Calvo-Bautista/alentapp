import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { PaymentDTO, CreatePaymentRequest } from '@alentapp/shared';

export class CreatePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentValidator: PaymentValidator
    ) {}

    async execute(data: CreatePaymentRequest): Promise<PaymentDTO> {
        // 1. Validaciones de negocio externas y de formato (antes en la entidad)
        await this.paymentValidator.validateNewPayment(data.member_id, data.month, data.year, data.amount);
        this.paymentValidator.validateInvariants(data.amount, data.month, data.year);

        // 2. Persistencia directa (Sin clase de entidad, igual que Member)
        return await this.paymentRepository.create({
            amount: data.amount,
            month: data.month,
            year: data.year,
            status: 'Pending',
            due_date: data.due_date,
            member_id: data.member_id,
            payment_date: null
        });
    }
}
