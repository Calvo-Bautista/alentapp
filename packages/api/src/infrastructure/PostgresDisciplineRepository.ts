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

    
    
    private mapToDTO(discipline: DBDiscipline): DisciplineDTO {
            return {
                id: discipline.id,
                reason: discipline.reason,
                start_date: discipline.start_date,
                end_date: discipline.end_date,
                is_total_suspension: discipline.is_total_suspension,
                member_id: discipline.member_id
            };
        }
    
}
