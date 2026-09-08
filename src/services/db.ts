import { 
  Student, 
  Lesson, 
  LessonStatus,
  ClassPlan, 
  StudyPlanner, 
  FinanceRecord, 
  TeacherSettings 
} from '../types';
import { appwriteService } from './appwrite';

const STORAGE_KEYS = {
  STUDENTS: 'mscarelli_students_v3',
  LESSONS: 'mscarelli_lessons_v3',
  CLASS_PLANS: 'mscarelli_class_plans_v3',
  STUDY_PLANNERS: 'mscarelli_study_planners_v3',
  PAYMENTS: 'mscarelli_payments_v3',
  SETTINGS: 'mscarelli_settings_v3'
};

export const defaultSettings: TeacherSettings = {
  name: 'Isabelle Carelli',
  email: 'isabelle.carelli@exemplo.com',
  title: 'Professora Particular de Inglês',
  city: 'São Paulo',
  state: 'SP',
  whatsapp: '(11) 98888-7777',
  hourlyRateDefault: 120
};

class DatabaseService {
  // --- STUDENTS ---
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading students from localStorage', e);
      return [];
    }
  }

  saveStudent(student: Student): Student[] {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === student.id);
    let updated: Student[];
    if (index >= 0) {
      updated = [...students];
      updated[index] = student;
    } else {
      updated = [student, ...students];
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));

    // Persist to Appwrite Database asynchronously
    appwriteService.saveStudentToAppwrite(student).catch(err => {
      console.warn('[Appwrite Sync Error]', err);
    });

    // Se o aluno possui recorrência ativa, gera automaticamente as próximas aulas do mês corrente
    if (student.isActive && student.hasRecurringSchedule && student.recurringSlots && student.recurringSlots.length > 0) {
      this.generateUpcomingLessonsForStudent(student);
    }

    return updated;
  }

  deleteStudent(id: string): Student[] {
    const students = this.getStudents().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    
    // Clean associated lessons
    const lessons = this.getLessons().filter(l => l.studentId !== id);
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
    
    // Delete from Appwrite Database
    appwriteService.deleteStudentFromAppwrite(id).catch(err => {
      console.warn('[Appwrite Sync Error]', err);
    });

    return students;
  }

  // --- LESSONS ---
  getLessons(): Lesson[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LESSONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading lessons from localStorage', e);
      return [];
    }
  }

  saveLesson(lesson: Lesson): Lesson[] {
    const lessons = this.getLessons();
    const index = lessons.findIndex(l => l.id === lesson.id);
    let updated: Lesson[];
    if (index >= 0) {
      updated = [...lessons];
      updated[index] = lesson;
    } else {
      updated = [lesson, ...lessons];
    }
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(updated));

    // Persist to Appwrite Database
    appwriteService.saveLessonToAppwrite(lesson).catch(err => {
      console.warn('[Appwrite Sync Error]', err);
    });

    return updated;
  }

  deleteLesson(id: string): Lesson[] {
    const lessons = this.getLessons().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));

    // Delete from Appwrite Database
    appwriteService.deleteLessonFromAppwrite(id).catch(err => {
      console.warn('[Appwrite Sync Error]', err);
    });

    return lessons;
  }

  // --- AUTOMATIC RECURRING LESSON GENERATION ---
  /**
   * Gera as próximas aulas restantes do mês atual para um aluno específico recém-cadastrado/editado.
   */
  generateUpcomingLessonsForStudent(student: Student): number {
    if (!student.hasRecurringSchedule || !student.recurringSlots || student.recurringSlots.length === 0) {
      return 0;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Último dia do mês
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentLessons = this.getLessons();
    const newLessons: Lesson[] = [];

    for (let day = today.getDate(); day <= lastDayOfMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      const dayOfWeek = dayDate.getDay();

      // Verifica se há slot recorrente neste dia da semana
      const matchingSlots = student.recurringSlots.filter(s => s.dayOfWeek === dayOfWeek);

      for (const slot of matchingSlots) {
        const [hoursStr, minutesStr] = slot.time.split(':');
        const lessonDate = new Date(currentYear, currentMonth, day, Number(hoursStr || 14), Number(minutesStr || 0), 0, 0);

        // Se a data já passou hoje, ignora
        if (lessonDate < today) continue;

        const dateISO = lessonDate.toISOString();

        // Evita duplicidade: verifica se já existe aula para este aluno neste mesmo horário
        const alreadyExists = currentLessons.some(l => 
          l.studentId === student.id && 
          new Date(l.date).getTime() === lessonDate.getTime()
        ) || newLessons.some(l => 
          l.studentId === student.id && 
          new Date(l.date).getTime() === lessonDate.getTime()
        );

        if (!alreadyExists) {
          newLessons.push({
            id: `lesson-rec-${student.id}-${lessonDate.getTime()}`,
            studentId: student.id,
            date: dateISO,
            durationMinutes: slot.durationMinutes || 60,
            subject: 'Inglês',
            topic: 'Aula Regular',
            status: LessonStatus.SCHEDULED,
            price: student.billingModel === 'POR_HORA' ? student.billingAmount : undefined
          });
        }
      }
    }

    if (newLessons.length > 0) {
      const updatedLessons = [...newLessons, ...currentLessons];
      localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(updatedLessons));
    }

    return newLessons.length;
  }

  /**
   * Gera todas as aulas do mês para todos os alunos recorrentes ativos.
   * Evita duplicidade verificando horários já existentes.
   */
  generateRecurringLessonsForMonth(targetDate: Date = new Date()): { createdCount: number; existingCount: number } {
    const students = this.getStudents().filter(s => s.isActive && s.hasRecurringSchedule && s.recurringSlots && s.recurringSlots.length > 0);
    const currentLessons = this.getLessons();

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    let createdCount = 0;
    let existingCount = 0;
    const newLessons: Lesson[] = [];

    students.forEach(student => {
      for (let day = 1; day <= lastDayOfMonth; day++) {
        const dayDate = new Date(year, month, day);
        const dayOfWeek = dayDate.getDay();

        const matchingSlots = student.recurringSlots.filter(s => s.dayOfWeek === dayOfWeek);

        for (const slot of matchingSlots) {
          const [hoursStr, minutesStr] = slot.time.split(':');
          const lessonDate = new Date(year, month, day, Number(hoursStr || 14), Number(minutesStr || 0), 0, 0);
          const dateISO = lessonDate.toISOString();

          const alreadyExists = currentLessons.some(l => 
            l.studentId === student.id && 
            new Date(l.date).getTime() === lessonDate.getTime()
          ) || newLessons.some(l => 
            l.studentId === student.id && 
            new Date(l.date).getTime() === lessonDate.getTime()
          );

          if (alreadyExists) {
            existingCount++;
          } else {
            createdCount++;
            newLessons.push({
              id: `lesson-rec-${student.id}-${lessonDate.getTime()}`,
              studentId: student.id,
              date: dateISO,
              durationMinutes: slot.durationMinutes || 60,
              subject: 'Inglês',
              topic: 'Aula Regular',
              status: LessonStatus.SCHEDULED,
              price: student.billingModel === 'POR_HORA' ? student.billingAmount : undefined
            });
          }
        }
      }
    });

    if (newLessons.length > 0) {
      const updatedLessons = [...newLessons, ...currentLessons];
      localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(updatedLessons));
    }

    return { createdCount, existingCount };
  }

  // --- CLASS PLANS ---
  getClassPlan(studentId: string): ClassPlan {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASS_PLANS);
      const plans: Record<string, ClassPlan> = data ? JSON.parse(data) : {};
      return plans[studentId] || {
        studentId,
        currentUnit: 'Unit 1 - Everyday Routines & Speaking',
        grammarTopics: 'Present Simple vs Present Continuous; Question tags',
        vocabularyTopics: 'Daily habits, hobbies, profession and business expressions',
        homework: 'Complete exercises 1 to 4 on page 12 and record a 1-minute audio',
        nextClassObjectives: 'Practice speaking with focus on fluency and pronunciation',
        lastUpdated: new Date().toISOString()
      };
    } catch (e) {
      console.error('Error reading class plan', e);
      return {
        studentId,
        currentUnit: '',
        grammarTopics: '',
        vocabularyTopics: '',
        homework: '',
        nextClassObjectives: '',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  saveClassPlan(plan: ClassPlan): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASS_PLANS);
      const plans: Record<string, ClassPlan> = data ? JSON.parse(data) : {};
      plans[plan.studentId] = { ...plan, lastUpdated: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.CLASS_PLANS, JSON.stringify(plans));

      appwriteService.saveClassPlanToAppwrite(plan).catch(err => {
        console.warn('[Appwrite Sync Error]', err);
      });
    } catch (e) {
      console.error('Error saving class plan', e);
    }
  }

  // --- STUDY PLANNERS ---
  getStudyPlanner(studentId: string): StudyPlanner {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_PLANNERS);
      const planners: Record<string, StudyPlanner> = data ? JSON.parse(data) : {};
      return planners[studentId] || {
        studentId,
        weeklyHoursTarget: 4,
        learningGoals: 'Alcançar confiança em reuniões corporativas e apresentações em inglês.',
        recommendedMaterials: 'Podcasts (BBC 6 Minute English), Livro English Grammar in Use, App Anki.',
        weeklyRoutine: '15 min de vocabulário diário + 1 episódio de podcast às terças e quintas.',
        notes: 'Focar na pronúncia do "th" e na entonação natural.',
        lastUpdated: new Date().toISOString()
      };
    } catch (e) {
      console.error('Error reading study planner', e);
      return {
        studentId,
        weeklyHoursTarget: 3,
        learningGoals: '',
        recommendedMaterials: '',
        weeklyRoutine: '',
        notes: '',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  saveStudyPlanner(planner: StudyPlanner): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_PLANNERS);
      const planners: Record<string, StudyPlanner> = data ? JSON.parse(data) : {};
      planners[planner.studentId] = { ...planner, lastUpdated: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.STUDY_PLANNERS, JSON.stringify(planners));

      appwriteService.saveStudyPlannerToAppwrite(planner).catch(err => {
        console.warn('[Appwrite Sync Error]', err);
      });
    } catch (e) {
      console.error('Error saving study planner', e);
    }
  }

  // --- PAYMENT STATUS RECORDS ---
  getPayments(): Record<string, { status: 'Pago' | 'Pendente'; paymentDate?: string; notes?: string }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error reading payments', e);
      return {};
    }
  }

  savePaymentStatus(recordKey: string, status: 'Pago' | 'Pendente', notes?: string): void {
    try {
      const payments = this.getPayments();
      payments[recordKey] = {
        status,
        paymentDate: status === 'Pago' ? new Date().toLocaleDateString('pt-BR') : undefined,
        notes
      };
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

      appwriteService.savePaymentToAppwrite(recordKey, status, notes).catch(err => {
        console.warn('[Appwrite Sync Error]', err);
      });
    } catch (e) {
      console.error('Error saving payment status', e);
    }
  }

  // --- APPWRITE SYNC ---
  async syncWithAppwrite(): Promise<{ success: boolean; message: string }> {
    if (!appwriteService.isConfigured()) {
      return { 
        success: false, 
        message: 'Appwrite não está configurado com um Project ID válido. Configure em Configurações.' 
      };
    }

    try {
      const [remoteStudents, remoteLessons] = await Promise.all([
        appwriteService.fetchStudentsFromAppwrite(),
        appwriteService.fetchLessonsFromAppwrite()
      ]);

      let pulledCount = 0;
      if (remoteStudents && remoteStudents.length > 0) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(remoteStudents));
        pulledCount += remoteStudents.length;
      }
      if (remoteLessons && remoteLessons.length > 0) {
        localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(remoteLessons));
        pulledCount += remoteLessons.length;
      }

      return {
        success: true,
        message: `Sincronização com Appwrite concluída com sucesso! (${pulledCount} registros atualizados)`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Falha ao sincronizar com Appwrite: ${err?.message || 'Verifique a conexão e credenciais'}`
      };
    }
  }

  // --- SETTINGS ---
  getSettings(): TeacherSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : defaultSettings;
    } catch (e) {
      console.error('Error reading settings', e);
      return defaultSettings;
    }
  }

  saveSettings(settings: TeacherSettings): TeacherSettings {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }
}

export const db = new DatabaseService();
