import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Payment as PrismaPayment } from '../generated/client/index.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO, PaymentWithMemberDTO } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL as any),
});

export class PostgresPaymentRepository implements PaymentRepository {
    async create(data: Omit<PaymentDTO, 'id'>): Promise<PaymentDTO> {
        const payment = await prisma.payment.create({
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

    async findAll(memberId?: string): Promise<PaymentWithMemberDTO[]> {
        const payments = await prisma.payment.findMany({
            where: {
                ...(memberId && { member_id: memberId })
            },
            include: { member: true },
            orderBy: { due_date: 'desc' }
        });
        return payments.map(p => ({
            ...this.mapToDTO(p),
            member_name: p.member.name
        }));
    }

    async findById(id: string): Promise<PaymentDTO | null> {
        const payment = await prisma.payment.findUnique({ where: { id } });
        return payment ? this.mapToDTO(payment) : null;
    }

    async findByMemberMonthYearAndAmount(member_id: string, month: number, year: number, amount: number): Promise<PaymentDTO | null> {
        const payment = await prisma.payment.findFirst({
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
