import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO, UpdatePaymentRequest } from '@alentapp/shared';

export class UpdatePaymentUseCase {
    constructor(private readonly paymentRepository: PaymentRepository) {}

    async execute(id: string, data: UpdatePaymentRequest): Promise<PaymentDTO> {
        const existingPayment = await this.paymentRepository.findById(id);
        if (!existingPayment) {
            throw new Error('El pago no existe');
        }

        // Regla de negocio TDD-0011: No se permite modificar registros que se encuentren en estado Canceled.
        if (existingPayment.status === 'Canceled') {
            throw new Error('No se pueden editar pagos anulados');
        }

        // Lógica de negocio: Si se marca como pagado y no viene fecha, ponemos la actual
        let finalData = { ...data };
        if (data.status === 'Paid' && !data.payment_date && !existingPayment.payment_date) {
            finalData.payment_date = new Date().toISOString();
        }

        return await this.paymentRepository.update(id, finalData);
    }
}
