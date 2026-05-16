import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerUseCase } from '../application/CreateLockerUseCase.js';
import { CreateLockerRequest } from '@alentapp/shared';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const locker = await this.createLockerUseCase.execute(request.body);
            return reply.status(201).send({ data: locker });
        } catch (error: any) {
            if (error.message.includes('Ya existe un casillero')) {
                return reply.status(409).send({ error: error.message });
            }
            if (
                error.message.includes('mantenimiento') ||
                error.message.includes('casillero disponible') ||
                error.message.includes('casillero ocupado')
            ) {
                return reply.status(409).send({ error: error.message });
            }
            if (
                error.message.includes('entero positivo') ||
                error.message.includes('socio indicado no existe')
            ) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}
