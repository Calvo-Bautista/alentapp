import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentWithMemberDTO } from '@alentapp/shared';

export class GetPaymentsUseCase {
    constructor(private readonly paymentRepository: PaymentRepository) {}

    async execute(memberId?: string): Promise<PaymentWithMemberDTO[]> {
        return await this.paymentRepository.findAll(memberId);
    }
}
