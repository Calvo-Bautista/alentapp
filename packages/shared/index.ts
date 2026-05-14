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
