import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerUseCase } from '../application/CreateLockerUseCase.js';
import { UpdateLockerUseCase } from '../application/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from '../application/DeleteLockerUseCase.js';
import { CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly updateLockerUseCase: UpdateLockerUseCase,
        private readonly deleteLockerUseCase: DeleteLockerUseCase,
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

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const locker = await this.updateLockerUseCase.execute(id, request.body);
            return reply.status(200).send({ data: locker });
        } catch (error: any) {
            if (error.message.includes('Ya existe un casillero')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('casillero no existe')) {
                return reply.status(400).send({ error: error.message });
            }
            if (
                error.message.includes('mantenimiento') ||
                error.message.includes('casillero disponible') ||
                error.message.includes('casillero ocupado') ||
                error.message.includes('desasignar')
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

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteLockerUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }
}
