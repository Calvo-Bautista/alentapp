// ==========================================
// Member
// ==========================================
export type MemberCategory = 'Pleno' | 'Cadete' | 'Honorario';
export type MemberStatus = 'Activo' | 'Moroso' | 'Suspendido';

export interface MemberDTO {
  id: string; // UUID
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
  status: MemberStatus;
  created_at: string; // ISO Date String
}

export interface CreateMemberRequest {
  dni: string;
  name: string;
  email: string;
  birthdate: string; // ISO Date String (YYYY-MM-DD)
  category: MemberCategory;
}

export interface UpdateMemberRequest {
  dni?: string;
  name?: string;
  email?: string;
  birthdate?: string; // ISO Date String (YYYY-MM-DD)
  category?: MemberCategory;
  status?: MemberStatus;
}


// ==========================================
// Medical Certificate
// ==========================================

export interface MedicalCertificateDTO {
  id: string; // UUID
  member_id: string;
  issue_date: string; // ISO Date String (YYYY-MM-DD)
  expiry_date: string; // ISO Date String (YYYY-MM-DD)
  doctor_license: string;
  is_validated: boolean;
  created_at: string; // ISO Date String
}

export interface CreateMedicalCertificateRequest {
  member_id: string;
  issue_date: string; // ISO Date String (YYYY-MM-DD)
  expiry_date: string; // ISO Date String (YYYY-MM-DD)
  doctor_license: string;
}

export interface UpdateMedicalCertificateRequest {
  issue_date?: string;    // ISO Date String (YYYY-MM-DD)
  expiry_date?: string;   // ISO Date String (YYYY-MM-DD)
  doctor_license?: string;
  is_validated?: boolean;
}

// ==========================================
// Payment
// ==========================================

// 1. Definimos los estados posibles según la regla de negocio
export type PaymentStatus = 'Pending' | 'Paid' | 'Canceled';

// 2. El DTO principal
export interface PaymentDTO {
  id: string;
  amount: number;
  month: number;
  year: number;
  status: PaymentStatus;
  due_date: string; // ISO Date String (YYYY-MM-DD)
  member_id: string;
  payment_date: string | null; // ISO Date String
}

export interface PaymentWithMemberDTO extends PaymentDTO {
  member_name: string;
}

// 3. El contrato para crear un Pago (POST)
// No se pide id, status ni payment_date, porque esos se generan solos.
export interface CreatePaymentRequest {
  amount: number;
  month: number;
  year: number;
  due_date: string; // ISO Date String (YYYY-MM-DD)
  member_id: string;
}

// 4. El contrato para actualizar un Pago
export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  payment_date?: string | null;
}

// ==========================================
// Discipline
// ==========================================

export interface DisciplineDTO {
  id: string;
  reason: string;
  start_date: string;
  end_date: string;
  is_total_suspension: boolean;
  member_id: string;
}

export interface CreateDisciplineRequest {
  reason: string;
  start_date: string;
  end_date: string;
  is_total_suspension: boolean;
  member_id: string;
}

export interface UpdateDisciplineRequest {
  reason?: string;
  start_date?: string;
  end_date?: string;
  is_total_suspension?: boolean;
  member_id?: string;
}

// ==========================================
// Sport
// ==========================================

export interface SportDTO {
  id: string;
  name: string;
  description: string;
  max_capacity: number;
  additional_price: number;
  requires_medical_certificate: boolean;
}

export interface CreateSportRequest {
  name: string;
  description: string;
  max_capacity: number;
  additional_price: number;
  requires_medical_certificate: boolean;
}

// 'name' se omite intencionalmente: el nombre es inmutable tras la creación (TDD-0017)
export interface UpdateSportRequest {
  description?: string;
  max_capacity?: number;
  additional_price?: number;
  requires_medical_certificate?: boolean;
}
