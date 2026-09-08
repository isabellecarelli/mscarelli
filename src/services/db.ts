import { 
  Student, 
  Lesson, 
  ClassPlan, 
  StudyPlanner, 
  FinanceRecord, 
  TeacherSettings 
} from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'mscarelli_students_v2',
  LESSONS: 'mscarelli_lessons_v2',
  CLASS_PLANS: 'mscarelli_class_plans_v2',
  STUDY_PLANNERS: 'mscarelli_study_planners_v2',
  FINANCE: 'mscarelli_finance_v2',
  SETTINGS: 'mscarelli_settings_v2'
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
    this.syncFinanceWithStudents(updated);
    return updated;
  }

  deleteStudent(id: string): Student[] {
    const students = this.getStudents().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    
    // Clean associated lessons
    const lessons = this.getLessons().filter(l => l.studentId !== id);
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
    
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
    return updated;
  }

  deleteLesson(id: string): Lesson[] {
    const lessons = this.getLessons().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
    return lessons;
  }

  // --- CLASS PLANS ---
  getClassPlan(studentId: string): ClassPlan {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASS_PLANS);
      const plans: Record<string, ClassPlan> = data ? JSON.parse(data) : {};
      return plans[studentId] || {
        studentId,
        currentUnit: 'Unit 1 - Introduction & Everyday Routines',
        grammarTopics: 'Simple Present vs Present Continuous; Question formation',
        vocabularyTopics: 'Daily habits, hobbies, profession and workplace expressions',
        homework: 'Complete exercises 1 to 4 on page 12 and write a 100-word paragraph about your day',
        nextClassObjectives: 'Practice speaking with focus on fluency and pronunciation of -ed endings',
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
        recommendedMaterials: 'Podcasts (6 Minute English, BBC), Livro English Grammar in Use, App Anki.',
        weeklyRoutine: '15 min de vocabulário diário no Anki + 1 episódio de podcast às terças e quintas.',
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
    } catch (e) {
      console.error('Error saving study planner', e);
    }
  }

  // --- FINANCE RECORDS ---
  getFinanceRecords(): FinanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FINANCE);
      if (data) return JSON.parse(data);
      
      // Auto-generate from students if empty
      const students = this.getStudents();
      const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const initialRecords: FinanceRecord[] = students.map(s => ({
        id: `fin-${s.id}`,
        studentId: s.id,
        month: currentMonth,
        hourlyRate: s.hourlyRate || 120,
        classesCount: 4,
        totalAmount: (s.hourlyRate || 120) * 4,
        status: 'Pendente',
        notes: 'Mensalidade regular'
      }));
      localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(initialRecords));
      return initialRecords;
    } catch (e) {
      console.error('Error reading finance records', e);
      return [];
    }
  }

  saveFinanceRecord(record: FinanceRecord): FinanceRecord[] {
    const records = this.getFinanceRecords();
    const index = records.findIndex(r => r.id === record.id);
    let updated: FinanceRecord[];
    if (index >= 0) {
      updated = [...records];
      updated[index] = record;
    } else {
      updated = [record, ...records];
    }
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(updated));
    return updated;
  }

  syncFinanceWithStudents(students: Student[]): void {
    const currentRecords = this.getFinanceRecords();
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    let hasChanges = false;
    const updated = [...currentRecords];

    students.forEach(s => {
      const existing = updated.find(r => r.studentId === s.id);
      if (!existing && s.isActive) {
        hasChanges = true;
        updated.push({
          id: `fin-${s.id}-${Date.now()}`,
          studentId: s.id,
          month: currentMonth,
          hourlyRate: s.hourlyRate || 120,
          classesCount: 4,
          totalAmount: (s.hourlyRate || 120) * 4,
          status: 'Pendente',
          notes: 'Mensalidade regular'
        });
      }
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(updated));
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
