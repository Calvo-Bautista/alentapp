import { SportDTO, UpdateSportRequest } from '@alentapp/shared';

// Puerto de Salida (Driven Port).
// El dominio define QUÉ operaciones necesita, sin saber CÓMO se implementan.

export interface SportRepository {
  create(data: Omit<SportDTO, 'id'>): Promise<SportDTO>;
  findById(id: string): Promise<SportDTO | null>;
  findByName(name: string): Promise<SportDTO | null>;
  findAll(): Promise<SportDTO[]>;
  update(id: string, data: UpdateSportRequest): Promise<SportDTO>;
  delete(id: string): Promise<void>;
}
