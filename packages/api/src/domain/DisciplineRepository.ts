import { DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared';

// Esta interfaz es el "Puerto de Salida". El dominio dice: 
// "No me importa si usás Postgres o Mongo, dame un objeto que cumpla esto".

export interface DisciplineRepository {
  create(discipline: Omit<DisciplineDTO, 'id'>): Promise<DisciplineDTO>;
  findById(id: string): Promise<DisciplineDTO | null>;
  findAll(): Promise<DisciplineDTO[]>;
  findByMemberId(memberId: string): Promise<DisciplineDTO[]> | null;
  update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO>;
  delete(id: string): Promise<void>;
}