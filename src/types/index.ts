export enum LessonStatus {
  SCHEDULED = "Agendada",
  COMPLETED = "Realizada",
  CANCELLED_CHARGED = "Cancelada (C/ Cobrança)",
  CANCELLED_FREE = "Cancelada (S/ Cobrança)",
  POSTPONED = "Adiada"
}

export type EnglishLevel = 
  | 'Iniciante (A1)'
  | 'Básico (A2)'
  | 'Intermediário (B1)'
  | 'Intermediário Superior (B2)'
  | 'Avançado (C1)'
  | 'Fluente / Proficiente (C2)'
  | 'Inglês para Negócios'
  | 'Preparatório (IELTS/TOEFL)';

export type BillingModel = 'MENSALIDADE_FIXA' | 'POR_HORA';

export interface RecurringScheduleSlot {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  time: string; // "14:00"
  durationMinutes: number; // 60
}

export interface Student {
  id: string;
  name: string;
  phone?: string;
  level: EnglishLevel;
  
  // Modelo de Cobrança
  billingModel: BillingModel;
  billingAmount: number; // Valor da Mensalidade Fixa (vence dia 10) OU Valor por Hora (paga pós-aula)
  
  // Agenda Padrão (Recorrência)
  hasRecurringSchedule: boolean;
  recurringSlots: RecurringScheduleSlot[];
  defaultScheduleText: string; // Ex: "Terças e Quintas às 14:00"
  
  // Links Externos
  studyPlannerUrl?: string;
  classPlanUrl?: string;
  
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  date: string; // ISO String (Ex: 2026-09-08T14:00:00.000Z)
  durationMinutes: number;
  subject?: string;
  topic?: string;
  status: LessonStatus;
  notes?: string;
  homework?: string;
  price?: number;
  paid?: boolean; // Para cobrança por hora
}

export interface ClassPlan {
  studentId: string;
  currentUnit: string;
  grammarTopics: string;
  vocabularyTopics: string;
  homework: string;
  nextClassObjectives: string;
  lastUpdated: string;
}

export interface StudyPlanner {
  studentId: string;
  weeklyHoursTarget: number;
  learningGoals: string;
  recommendedMaterials: string;
  weeklyRoutine: string;
  notes: string;
  lastUpdated: string;
}

export interface FinanceRecord {
  id: string;
  studentId: string;
  month: string;
  billingModel: BillingModel;
  hourlyRate?: number;
  billingAmount: number;
  classesCount: number;
  totalAmount: number;
  status: 'Pago' | 'Pendente';
  dueDate: string; // "Dia 10" ou "Pós-aula"
  paymentDate?: string;
  notes?: string;
}

export interface TeacherSettings {
  name: string;
  email: string;
  title: string;
  city?: string;
  state?: string;
  whatsapp?: string;
  hourlyRateDefault: number;
}

export type ViewType = 
  | 'dashboard'
  | 'students'
  | 'schedule'
  | 'lesson-log'
  | 'finance'
  | 'settings';
