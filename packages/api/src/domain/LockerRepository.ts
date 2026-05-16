import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';

// Puerto de Salida (Driven Port).
// El dominio define QUÉ operaciones necesita, sin saber CÓMO se implementan.

export interface LockerRepository {
  create(data: Omit<LockerDTO, 'id' | 'created_at'>): Promise<LockerDTO>;
  findById(id: string): Promise<LockerDTO | null>;
  findByNumber(number: number): Promise<LockerDTO | null>;
  update(id: string, data: UpdateLockerRequest): Promise<LockerDTO>;
}
