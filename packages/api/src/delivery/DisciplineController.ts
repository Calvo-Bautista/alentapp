import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const sancion = await this.createDisciplineUseCase.execute(request.body);
            return reply.status(201).send({ data: sancion });
        } catch (error: any) {
            if (error.message.includes('Ya existe una sancion con ese ID')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('No existe ese socio en el club') || error.message.includes('inválido')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    async update(
            request: FastifyRequest<{ Params: { id: string }; Body: UpdateDisciplineRequest }>,
            reply: FastifyReply,
        ) {
            try {
                const { id } = request.params;
                const sancion = await this.updateDisciplineUseCase.execute(id, request.body);
                return reply.status(200).send({ data: sancion });
            } catch (error: any) {
                if (error.message.includes('Ya existe una sancion con ese ID')) {
                    return reply.status(409).send({ error: error.message });
                }
                if (error.message.includes('inválido') || error.message.includes('no existe')) {
                    return reply.status(400).send({ error: error.message });
                }
                return reply.status(500).send({ error: "Error interno, reintente más tarde" });
            }
        }
}
