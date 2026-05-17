import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO, UpdateMedicalCertificateRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});


type DBMedicalCertificate = {
    id: string;
    member_id: string;
    issue_date: Date;
    expiry_date: Date;
    doctor_license: string;
    is_validated: boolean;
    created_at: Date;
};

export class PostgresMedicalCertificateRepository implements MedicalCertificateRepository {

    async create(data: Omit<MedicalCertificateDTO, 'id'>): Promise<MedicalCertificateDTO> {
        const certificate = await prisma.medicalCertificate.create({
            data: {
                member_id: data.member_id,
                issue_date: new Date(data.issue_date),
                expiry_date: new Date(data.expiry_date),
                doctor_license: data.doctor_license,
                is_validated: data.is_validated,
            },
        });

        return this.mapToDTO(certificate);
    }

        async findById(id: string): Promise<MedicalCertificateDTO | null> {
        const certificate = await prisma.medicalCertificate.findUnique({
            where: { id },
        });

        return certificate ? this.mapToDTO(certificate) : null;
    }

    async update(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
        const certificate = await prisma.medicalCertificate.update({
            where: { id },
            data: {
                ...(data.issue_date && { issue_date: new Date(data.issue_date) }),
                ...(data.expiry_date && { expiry_date: new Date(data.expiry_date) }),
                ...(data.doctor_license && { doctor_license: data.doctor_license }),
                ...(data.is_validated !== undefined && { is_validated: data.is_validated }),
            },
        });

        return this.mapToDTO(certificate);
    }


    async invalidateByMemberId(memberId: string): Promise<void> {
        await prisma.medicalCertificate.updateMany({
            where: {
                member_id: memberId,
                is_validated: true,
            },
            data: {
                is_validated: false,
            },
        });
    }

    async findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]> {
        const certificates = await prisma.medicalCertificate.findMany({
            where: { member_id: memberId },
            orderBy: { created_at: 'desc' },
        });

        return certificates.map(this.mapToDTO);
    }

    private mapToDTO(cert: DBMedicalCertificate): MedicalCertificateDTO {
        return {
            id: cert.id,
            member_id: cert.member_id,
            issue_date: cert.issue_date.toISOString().split('T')[0],
            expiry_date: cert.expiry_date.toISOString().split('T')[0],
            doctor_license: cert.doctor_license,
            is_validated: cert.is_validated,
            created_at: cert.created_at.toISOString(),
        };
    }

    async findById(id: string): Promise<MedicalCertificateDTO | null> {
        const certificate = await this.prisma.medicalCertificate.findUnique({
            where: { id },
        });

        return certificate ? this.mapToDTO(certificate) : null;
    }

    async delete(id: string): Promise<void> {
        try {
            await this.prisma.medicalCertificate.delete({
                where: { id },
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new Error('El certificado no existe');
            }
            throw error;
        }
    }

}
