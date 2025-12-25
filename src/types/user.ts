export interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'franqueado' | 'vendedor' | 'professor' | 'coordenador' | 'assessora_adm' | 'supervisor_adm' | 'pai' | 'mae' | 'filho' | 'filha' | 'outro';
  is_active: boolean;
  password_hash?: string;
  created_at: Date;
  last_login?: Date;
  first_login_completed?: boolean;
  family_id?: string; // ✅ Vínculo com o núcleo familiar
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface FamilyNucleus {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  created_by?: string;
}
