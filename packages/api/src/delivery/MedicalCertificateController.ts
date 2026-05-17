import { FastifyRequest, FastifyReply } from 'fastify';
import { GetMedicalCertificatesUseCase } from '../application/GetMedicalCertificatesUseCase.js';
import { CreateMedicalCertificateUseCase } from '../application/NewMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from '../application/DeleteMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';
import { UpdateMedicalCertificateUseCase } from '../application/UpdateMedicalCertificateUseCase.js';

export class MedicalCertificateController {
    constructor(
        private readonly createCertificateUseCase: CreateMedicalCertificateUseCase,
        private readonly deleteCertificateUseCase: DeleteMedicalCertificateUseCase,
        private readonly updateCertificateUseCase: UpdateMedicalCertificateUseCase,
        private readonly getCertificatesUseCase: GetMedicalCertificatesUseCase,
    ) {}

    async getByMember(
        request: FastifyRequest<{ Params: { memberId: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { memberId } = request.params;
            const certificates = await this.getCertificatesUseCase.execute(memberId);
            return reply.status(200).send({ data: certificates });
        } catch (error: any) {
            return reply.status(500).send({ error: 'Error interno, reintente mas tarde' });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateMedicalCertificateRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const certificate = await this.createCertificateUseCase.execute(request.body);
            return reply.status(201).send({ data: certificate });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('emisión') || error.message.includes('emision') || error.message.includes('vencimiento') || error.message.includes('activo')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
    
    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateMedicalCertificateRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const certificate = await this.updateCertificateUseCase.execute(id, request.body);
            return reply.status(200).send({ data: certificate });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('emision') || error.message.includes('emisión') || error.message.includes('vencimiento')) {
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
            await this.deleteCertificateUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }

}