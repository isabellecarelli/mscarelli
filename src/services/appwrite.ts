import { Client, Databases, ID, Query } from 'appwrite';
import { Student, Lesson, ClassPlan, StudyPlanner, TeacherSettings } from '../types';

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
}

const STORAGE_KEY_APPWRITE_CONFIG = 'mscarelli_appwrite_config';

export const getDefaultAppwriteConfig = (): AppwriteConfig => {
  const DEFAULT_CONFIG: AppwriteConfig = {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1',
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '6a9f78d200262eb4d9f3',
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '6a9f999a0039d879f8d2'
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY_APPWRITE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If the saved config is outdated or uses old endpoint/projectId, refresh to real config
      if (parsed.projectId !== '6a9f78d200262eb4d9f3' || parsed.endpoint === 'https://cloud.appwrite.io/v1') {
        localStorage.setItem(STORAGE_KEY_APPWRITE_CONFIG, JSON.stringify(DEFAULT_CONFIG));
        return DEFAULT_CONFIG;
      }
      return parsed;
    }
  } catch (e) {
    // fallback
  }

  return DEFAULT_CONFIG;
};

export const COLLECTIONS = {
  STUDENTS: 'students',
  LESSONS: 'lessons',
  CLASS_PLANS: 'class_plans',
  STUDY_PLANNERS: 'study_planners',
  PAYMENTS: 'payments',
  SETTINGS: 'settings'
};

class AppwriteService {
  private client: Client;
  private databases: Databases;
  private config: AppwriteConfig;

  constructor() {
    this.config = getDefaultAppwriteConfig();
    this.client = new Client();
    this.client
      .setEndpoint(this.config.endpoint)
      .setProject(this.config.projectId);
    this.databases = new Databases(this.client);
  }

  updateConfig(newConfig: Partial<AppwriteConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(STORAGE_KEY_APPWRITE_CONFIG, JSON.stringify(this.config));
    this.client = new Client();
    this.client
      .setEndpoint(this.config.endpoint)
      .setProject(this.config.projectId);
    this.databases = new Databases(this.client);
  }

  getConfig(): AppwriteConfig {
    return this.config;
  }

  isConfigured(): boolean {
    return !!this.config.projectId && this.config.projectId !== 'placeholder';
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { ok: false, message: 'Project ID não configurado.' };
    }
    try {
      // Test querying database / collection
      await this.databases.listDocuments(
        this.config.databaseId,
        COLLECTIONS.STUDENTS,
        [Query.limit(1)]
      );
      return { ok: true, message: 'Conexão com Appwrite estabelecida com sucesso!' };
    } catch (err: any) {
      if (err.code === 404) {
        return { 
          ok: true, 
          message: 'Conectado ao Appwrite! (Nota: a base ou coleções serão criadas conforme os dados forem adicionados)' 
        };
      }
      return { 
        ok: false, 
        message: `Erro na conexão: ${err.message || 'Verifique Project ID e Database ID'}` 
      };
    }
  }

  // --- STUDENTS ---
  async saveStudentToAppwrite(student: Student): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const payload = {
        name: student.name,
        phone: student.phone || '',
        level: student.level,
        billingModel: student.billingModel,
        billingAmount: student.billingAmount,
        hasRecurringSchedule: student.hasRecurringSchedule,
        recurringSlots: JSON.stringify(student.recurringSlots || []),
        defaultScheduleText: student.defaultScheduleText || '',
        studyPlannerUrl: student.studyPlannerUrl || '',
        classPlanUrl: student.classPlanUrl || '',
        isActive: student.isActive,
        notes: student.notes || '',
        createdAt: student.createdAt
      };

      try {
        await this.databases.updateDocument(
          this.config.databaseId,
          COLLECTIONS.STUDENTS,
          student.id,
          payload
        );
      } catch (err: any) {
        if (err.code === 404) {
          await this.databases.createDocument(
            this.config.databaseId,
            COLLECTIONS.STUDENTS,
            student.id,
            payload
          );
        } else {
          throw err;
        }
      }
      return true;
    } catch (e) {
      console.warn('[Appwrite] Error saving student to Appwrite database:', e);
      return false;
    }
  }

  async deleteStudentFromAppwrite(id: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      await this.databases.deleteDocument(
        this.config.databaseId,
        COLLECTIONS.STUDENTS,
        id
      );
      return true;
    } catch (e) {
      console.warn('[Appwrite] Error deleting student from Appwrite database:', e);
      return false;
    }
  }

  async fetchStudentsFromAppwrite(): Promise<Student[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        COLLECTIONS.STUDENTS,
        [Query.limit(100)]
      );

      return response.documents.map((doc: any) => ({
        id: doc.$id,
        name: doc.name,
        phone: doc.phone,
        level: doc.level,
        billingModel: doc.billingModel,
        billingAmount: Number(doc.billingAmount),
        hasRecurringSchedule: !!doc.hasRecurringSchedule,
        recurringSlots: typeof doc.recurringSlots === 'string' ? JSON.parse(doc.recurringSlots) : (doc.recurringSlots || []),
        defaultScheduleText: doc.defaultScheduleText,
        studyPlannerUrl: doc.studyPlannerUrl,
        classPlanUrl: doc.classPlanUrl,
        isActive: doc.isActive !== false,
        notes: doc.notes,
        createdAt: doc.createdAt || doc.$createdAt
      }));
    } catch (e) {
      console.warn('[Appwrite] Could not fetch students from Appwrite:', e);
      return null;
    }
  }

  // --- LESSONS ---
  async saveLessonToAppwrite(lesson: Lesson): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const payload = {
        studentId: lesson.studentId,
        date: lesson.date,
        durationMinutes: lesson.durationMinutes,
        subject: lesson.subject || 'Inglês',
        topic: lesson.topic || '',
        status: lesson.status,
        notes: lesson.notes || '',
        homework: lesson.homework || '',
        price: lesson.price || 0,
        paid: !!lesson.paid
      };

      try {
        await this.databases.updateDocument(
          this.config.databaseId,
          COLLECTIONS.LESSONS,
          lesson.id,
          payload
        );
      } catch (err: any) {
        if (err.code === 404) {
          await this.databases.createDocument(
            this.config.databaseId,
            COLLECTIONS.LESSONS,
            lesson.id,
            payload
          );
        } else {
          throw err;
        }
      }
      return true;
    } catch (e) {
      console.warn('[Appwrite] Error saving lesson to Appwrite:', e);
      return false;
    }
  }

  async deleteLessonFromAppwrite(id: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      await this.databases.deleteDocument(
        this.config.databaseId,
        COLLECTIONS.LESSONS,
        id
      );
      return true;
    } catch (e) {
      console.warn('[Appwrite] Error deleting lesson from Appwrite:', e);
      return false;
    }
  }

  async fetchLessonsFromAppwrite(): Promise<Lesson[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        COLLECTIONS.LESSONS,
        [Query.limit(500)]
      );

      return response.documents.map((doc: any) => ({
        id: doc.$id,
        studentId: doc.studentId,
        date: doc.date,
        durationMinutes: doc.durationMinutes,
        subject: doc.subject,
        topic: doc.topic,
        status: doc.status,
        notes: doc.notes,
        homework: doc.homework,
        price: doc.price,
        paid: doc.paid
      }));
    } catch (e) {
      console.warn('[Appwrite] Could not fetch lessons from Appwrite:', e);
      return null;
    }
  }

  // --- CLASS PLANS ---
  async saveClassPlanToAppwrite(plan: ClassPlan): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const payload = {
        studentId: plan.studentId,
        currentUnit: plan.currentUnit,
        grammarTopics: plan.grammarTopics,
        vocabularyTopics: plan.vocabularyTopics,
        homework: plan.homework,
        nextClassObjectives: plan.nextClassObjectives,
        lastUpdated: plan.lastUpdated
      };

      try {
        await this.databases.updateDocument(
          this.config.databaseId,
          COLLECTIONS.CLASS_PLANS,
          plan.studentId,
          payload
        );
      } catch (err: any) {
        if (err.code === 404) {
          await this.databases.createDocument(
            this.config.databaseId,
            COLLECTIONS.CLASS_PLANS,
            plan.studentId,
            payload
          );
        } else {
          throw err;
        }
      }
      return true;
    } catch (e) {
      console.warn('[Appwrite] Error saving class plan to Appwrite:', e);
      return false;
    }
  }

  // --- STUDY PLANNERS ---
  async saveStudyPlannerToAppwrite(planner: StudyPlanner): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const payload = {
        studentId: planner.studentId,
        weeklyHoursTarget: planner.weeklyHoursTarget,
        learningGoals: planner.learningGoals,
        recommendedMaterials: planner.recommendedMaterials,
        weeklyRoutine: planner.weeklyRoutine,
        notes: planner.notes,
        lastUpdated: planner.lastUpdated
      };

      try {
        await this.databases.updateDocument(
          this.config.databaseId,
          COLLECTIONS.STUDY_PLANNERS,
          planner.studentId,
          payload
        );
      } catch (err: any) {
        if (err.code === 404) {
          await this.databases.createDocument(
            this.config.databaseId,
            COLLECTIONS.STUDY_PLANNERS,
            planner.studentId,
            payload
          );
        } else {
          throw err;
        }
      }
      return true;
    } catch (e) {
      console.warn('[Appwrite] Error saving study planner to Appwrite:', e);
      return false;
    }
  }

  // --- PAYMENTS ---
  async savePaymentToAppwrite(paymentKey: string, status: 'Pago' | 'Pendente', notes?: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const payload = {
        key: paymentKey,
        status,
        paymentDate: status === 'Pago' ? new Date().toISOString() : '',
        notes: notes || ''
      };

      try {
        await this.databases.updateDocument(
          this.config.databaseId,
          COLLECTIONS.PAYMENTS,
          paymentKey,
          payload
        );
      } catch (err: any) {
        if (err.code === 404) {
          await this.databases.createDocument(
            this.config.databaseId,
            COLLECTIONS.PAYMENTS,
            paymentKey,
            payload
          );
        } else {
          throw err;
        }
      }
      return true;
    } catch (e) {
      console.warn('[Appwrite] Error saving payment to Appwrite:', e);
      return false;
    }
  }

  // --- PUSH BATCH TO APPWRITE ---
  async pushStudentsToAppwrite(students: Student[]): Promise<number> {
    if (!this.isConfigured() || !students.length) return 0;
    let count = 0;
    for (const student of students) {
      const ok = await this.saveStudentToAppwrite(student);
      if (ok) count++;
    }
    return count;
  }

  async pushLessonsToAppwrite(lessons: Lesson[]): Promise<number> {
    if (!this.isConfigured() || !lessons.length) return 0;
    let count = 0;
    for (const lesson of lessons) {
      const ok = await this.saveLessonToAppwrite(lesson);
      if (ok) count++;
    }
    return count;
  }
}

export const appwriteService = new AppwriteService();
