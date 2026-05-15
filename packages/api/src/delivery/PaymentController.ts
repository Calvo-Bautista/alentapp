import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/CreatePaymentUseCase.js';
import { GetPaymentsUseCase } from '../application/GetPaymentsUseCase.js';
import { CreatePaymentRequest } from '@alentapp/shared';

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly getPaymentsUseCase: GetPaymentsUseCase
    ) {}

    async getAll(request: FastifyRequest<{ Querystring: { member_id?: string } }>, reply: FastifyReply) {
        try {
            const { member_id } = request.query;
            const result = await this.getPaymentsUseCase.execute(member_id);
            return reply.status(200).send({ data: result });
        } catch (error: any) {
            return reply.status(500).send({ error: "Error al obtener los pagos" });
        }
    }

    async create(request: FastifyRequest<{ Body: CreatePaymentRequest }>, reply: FastifyReply) {
        try {
            const result = await this.createPaymentUseCase.execute(request.body);
            // Alineado con el formato del profesor: { data: ... }
            return reply.status(201).send({ data: result });
        } catch (error: any) {
            // Manejo de errores consistente con MemberController
            if (error.message.includes('ya tiene un pago')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('no existe') || error.message.includes('inválido') || error.message.includes('debe ser')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }
}
