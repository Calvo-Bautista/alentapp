const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

// Interfaces temporales (se reemplazarán por @alentapp/shared cuando la PR del backend sea aprobada)
export interface PaymentDTO {
  id: string;
  amount: number;
  month: number;
  year: number;
  status: 'Pending' | 'Paid' | 'Canceled';
  due_date: string;
  member_id: string;
  payment_date: string | null;
}

export interface CreatePaymentRequest {
  amount: number;
  month: number;
  year: number;
  due_date: string;
  member_id: string;
}

export const paymentsService = {
  async getAll(): Promise<PaymentDTO[]> {
    const response = await fetch(`${API_URL}/pagos`);
    if (!response.ok) {
      throw new Error('Error al obtener los pagos');
    }
    const result = await response.json();
    return result.data;
  },

  async create(data: CreatePaymentRequest): Promise<PaymentDTO> {
    const response = await fetch(`${API_URL}/pagos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al registrar el pago');
    }
    const result = await response.json();
    return result.data;
  },
};
