import { PaymentDTO } from '@alentapp/shared';

// Puerto de Salida limitado al alcance de "Alta de Pago"
export interface PaymentRepository {
  create(payment: Omit<PaymentDTO, 'id'>): Promise<PaymentDTO>;
  findById(id: string): Promise<PaymentDTO | null>;
  
  // Necesario para la validación de duplicados en el alta
  findByMemberMonthYearAndAmount(
    memberId: string, 
    month: number, 
    year: number, 
    amount: number
  ): Promise<PaymentDTO | null>;
}
