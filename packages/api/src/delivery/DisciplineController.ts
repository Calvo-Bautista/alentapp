import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from '../application/DeleteDisciplineUseCase.js';
import { GetDisciplineUseCase } from '../application/GetDisciplineUseCase.js';
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
        private readonly deleteDisciplineUseCase: DeleteDisciplineUseCase,
        private readonly getDisciplineUseCase: GetDisciplineUseCase,
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
            if (
                error.message.includes('No existe ese socio en el club')
                || error.message.includes('inválido')
                || error.message.includes('lapso de tiempo')
                || error.message.includes('menor a la fecha de fin')
            ) {
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
                if (
                    error.message.includes('inválido')
                    || error.message.includes('no existe')
                    || error.message.includes('lapso de tiempo')
                    || error.message.includes('menor a la fecha de fin')
                ) {
                    return reply.status(400).send({ error: error.message });
                }
                return reply.status(500).send({ error: "Error interno, reintente más tarde" });
            }
        }
    
    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteDisciplineUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(400).send({ error: error.message });
        }
    }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const sanciones = await this.getDisciplineUseCase.getAll();
            return reply.status(200).send({ data: sanciones });
        } catch (error: any) {
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async getById( request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply ) {
        try {
            const { id } = request.params;
            const sancion = await this.getDisciplineUseCase.getById(id);
            return reply.status(200).send({ data: sancion });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
            return reply.status(404).send({ error: error.message });
        }
        return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async getByMember(
        request: FastifyRequest<{ Params: { memberId: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { memberId } = request.params;
            const sanciones = await this.getDisciplineUseCase.getByMemberId(memberId);
            return reply.status(200).send({ data: sanciones });
        } catch (error: any) {
            if (error.message.includes('requerido')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}
