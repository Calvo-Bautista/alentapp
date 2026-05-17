import { MedicalCertificateDTO, UpdateMedicalCertificateRequest } from '@alentapp/shared';

export interface MedicalCertificateRepository {
  create(data: Omit<MedicalCertificateDTO, 'id'>): Promise<MedicalCertificateDTO>;
  invalidateByMemberId(memberId: string): Promise<void>;
  findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]>;
  findById(id: string): Promise<MedicalCertificateDTO | null>;
  delete(id: string): Promise<void>;
  update(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO>;
}