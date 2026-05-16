import { PaymentRepository } from '../domain/PaymentRepository.js';

export class DeletePaymentUseCase {
    constructor(private readonly paymentRepository: PaymentRepository) {}

    async execute(id: string): Promise<void> {
        const payment = await this.paymentRepository.findById(id);
        
        if (!payment) {
            throw new Error('Pago no encontrado');
        }

        if (payment.status === 'Canceled') {
            throw new Error('El pago ya ha sido cancelado previamente');
        }

        if (payment.status === 'Paid') {
            throw new Error('No se puede cancelar un pago ya procesado');
        }

        await this.paymentRepository.delete(id);
    }
}
