export enum LessonStatus {
  SCHEDULED = "Agendada",
  COMPLETED = "Realizada",
  CANCELLED_CHARGED = "Cancelada (C/ Cobrança)",
  CANCELLED_FREE = "Cancelada (S/ Cobrança)",
  POSTPONED = "Adiada"
}

export enum SpecialNeed {
  TDAH = "TDAH",
  AUTISMO = "Autismo",
  DISLEXIA = "Dislexia",
  DEFICIT_ATENCAO = "Déficit de Atenção",
  NONE = "Nenhuma"
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  specialNeed?: SpecialNeed;
  hourlyRate?: number;
  notes?: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  date: string; // ISO String (e.g. 2026-09-08T14:00:00.000Z)
  durationMinutes: number;
  subject?: string;
  topic?: string;
  status: LessonStatus;
  notes?: string;
  price?: number;
}

export interface TeacherSettings {
  name: string;
  email: string;
  enableRepertoireTracking?: boolean;
  city?: string;
  state?: string;
  whatsapp?: string;
}

export type ViewType = 
  | 'dashboard'
  | 'students'
  | 'schedule'
  | 'lesson-log'
  | 'repertoire'
  | 'finance'
  | 'expenses'
  | 'ai-tools'
  | 'settings';
