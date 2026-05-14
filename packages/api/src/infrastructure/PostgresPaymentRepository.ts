import { PrismaClient, Payment as PrismaPayment } from '../generated/client/index.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';

export class PostgresPaymentRepository implements PaymentRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(data: Omit<PaymentDTO, 'id'>): Promise<PaymentDTO> {
        const payment = await this.prisma.payment.create({
            data: {
                amount: data.amount,
                month: data.month,
                year: data.year,
                status: data.status,
                due_date: new Date(data.due_date),
                member_id: data.member_id,
                payment_date: data.payment_date ? new Date(data.payment_date) : null,
            },
        });
        return this.mapToDTO(payment);
    }

    async findById(id: string): Promise<PaymentDTO | null> {
        const payment = await this.prisma.payment.findUnique({ where: { id } });
        return payment ? this.mapToDTO(payment) : null;
    }

    async findByMemberMonthYearAndAmount(member_id: string, month: number, year: number, amount: number): Promise<PaymentDTO | null> {
        const payment = await this.prisma.payment.findFirst({
            where: { member_id, month, year, amount }
        });
        return payment ? this.mapToDTO(payment) : null;
    }

    private mapToDTO(record: PrismaPayment): PaymentDTO {
        return {
            id: record.id,
            amount: record.amount,
            month: record.month,
            year: record.year,
            status: record.status as 'Pending' | 'Paid' | 'Canceled',
            due_date: record.due_date.toISOString().split('T')[0],
            member_id: record.member_id,
            payment_date: record.payment_date ? record.payment_date.toISOString() : null,
        };
    }
}
