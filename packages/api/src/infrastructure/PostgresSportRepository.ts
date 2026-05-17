import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/index.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportDTO, UpdateSportRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBSport = {
    id: string;
    name: string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
};

export class PostgresSportRepository implements SportRepository {
    async create(data: Omit<SportDTO, 'id'>): Promise<SportDTO> {
        const sport = await prisma.sport.create({
            data: {
                name: data.name,
                description: data.description,
                max_capacity: data.max_capacity,
                additional_price: data.additional_price,
                requires_medical_certificate: data.requires_medical_certificate,
            },
        });

        return this.mapToDTO(sport);
    }

    async findById(id: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({
            where: { id },
        });

        return sport ? this.mapToDTO(sport) : null;
    }

    async findByName(name: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({
            where: { name },
        });

        return sport ? this.mapToDTO(sport) : null;
    }

    async findAll(): Promise<SportDTO[]> {
        const sports = await prisma.sport.findMany({
            orderBy: { name: 'asc' },
        });

        return sports.map((s) => this.mapToDTO(s));
    }

    async update(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        const sport = await prisma.sport.update({
            where: { id },
            data: {
                ...(data.description !== undefined && { description: data.description }),
                ...(data.max_capacity !== undefined && { max_capacity: data.max_capacity }),
                ...(data.additional_price !== undefined && { additional_price: data.additional_price }),
                ...(data.requires_medical_certificate !== undefined && {
                    requires_medical_certificate: data.requires_medical_certificate,
                }),
            },
        });

        return this.mapToDTO(sport);
    }

    async delete(id: string): Promise<void> {
        try {
            await prisma.sport.delete({
                where: { id },
            });
        } catch (error: any) {
            // P2003: Foreign key constraint failed (deporte con inscripciones asociadas)
            if (error?.code === 'P2003') {
                throw new Error('No se puede borrar, tiene inscriptos');
            }
            throw error;
        }
    }

    private mapToDTO(sport: DBSport): SportDTO {
        return {
            id: sport.id,
            name: sport.name,
            description: sport.description,
            max_capacity: sport.max_capacity,
            additional_price: sport.additional_price,
            requires_medical_certificate: sport.requires_medical_certificate,
        };
    }
}
