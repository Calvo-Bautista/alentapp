import { PrismaClient} from '../generated/client/index.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO, CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';

type DBDiscipline = {
    id: string;
    reason: string;
    start_date: Date;
    end_date: Date;
    is_total_suspension: boolean;
    member_id: string;
}

export class PostgresDisciplineRepository implements DisciplineRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
            const discipline = await this.prisma.discipline.create({
                data: {
                    reason: data.reason,
                    start_date: new Date(data.start_date),
                    end_date: new Date(data.end_date),
                    is_total_suspension: Boolean(data.is_total_suspension),
                    member_id: data.member_id
                },
            });
    
            return this.mapToDTO(discipline);
        }

    async findById(id: string): Promise<DisciplineDTO | null> {
            const discipline = await this.prisma.discipline.findUnique({
                where: { id },
            });
    
            return discipline ? this.mapToDTO(discipline) : null;
        }
    
    async findAll(): Promise<DisciplineDTO[]> {
            const discipline = await this.prisma.discipline.findMany({
                orderBy: { start_date: 'asc' },
            });
    
            return discipline.map(this.mapToDTO);
        }

    async findByMemberId(memberId: string): Promise<DisciplineDTO[]> {
        const disciplines = await this.prisma.discipline.findMany({
            where: { member_id: memberId },
            orderBy: { start_date: 'asc' },
        });

        return disciplines.map(this.mapToDTO);
    }

    async update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
            const discipline = await this.prisma.discipline.update({
                where: { id },
                data: {
                    ...(data.reason && { reason: data.reason }),
                    ...(data.start_date && { start_date: new Date(data.start_date) }),
                    ...(data.end_date && { end_date: new Date(data.end_date) }),
                    ...(data.is_total_suspension && { is_total_suspension: data.is_total_suspension })
                },
            });
    
            return this.mapToDTO(discipline);
        }

    private mapToDTO(discipline: DBDiscipline): DisciplineDTO {
            return {
                id: discipline.id,
                reason: discipline.reason,
                start_date: discipline.start_date.toISOString().split('T')[0],
                end_date: discipline.end_date.toISOString().split('T')[0],
                is_total_suspension: discipline.is_total_suspension,
                member_id: discipline.member_id
            };
        }
    
}
