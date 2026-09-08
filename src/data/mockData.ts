import { Student, Lesson, LessonStatus, SpecialNeed } from '../types';

export const mockStudents: Student[] = [
  {
    id: 'stud-1',
    name: 'Ana Beatriz Souza',
    email: 'anabeatriz@exemplo.com',
    phone: '(11) 98765-4321',
    address: 'Rua das Flores, 142 - Apto 31',
    isActive: true,
    specialNeed: SpecialNeed.NONE,
    hourlyRate: 120
  },
  {
    id: 'stud-2',
    name: 'Lucas Gabriel Oliveira',
    email: 'lucas.gabriel@exemplo.com',
    phone: '(11) 97654-3210',
    address: 'Av. Paulista, 1500 - Bela Vista',
    isActive: true,
    specialNeed: SpecialNeed.TDAH,
    hourlyRate: 130
  },
  {
    id: 'stud-3',
    name: 'Mariana Costa Lima',
    email: 'mariana.costa@exemplo.com',
    phone: '(11) 96543-2109',
    address: 'Rua Oscar Freire, 820 - Jardins',
    isActive: true,
    specialNeed: SpecialNeed.NONE,
    hourlyRate: 140
  },
  {
    id: 'stud-4',
    name: 'Pedro Henrique Ramos',
    email: 'pedro.henrique@exemplo.com',
    phone: '(11) 95432-1098',
    address: 'Rua Fradique Coutinho, 430 - Pinheiros',
    isActive: true,
    specialNeed: SpecialNeed.DEFICIT_ATENCAO,
    hourlyRate: 125
  },
  {
    id: 'stud-5',
    name: 'Sofia Albuquerque Mendes',
    email: 'sofia.mendes@exemplo.com',
    phone: '(11) 94321-0987',
    address: 'Al. Lorena, 600 - Jardins',
    isActive: true,
    specialNeed: SpecialNeed.AUTISMO,
    hourlyRate: 150
  },
  {
    id: 'stud-6',
    name: 'Enzo Rodrigues Silva',
    email: 'enzo.silva@exemplo.com',
    phone: '(11) 93210-9876',
    address: 'Rua Mourato Coelho, 220 - Pinheiros',
    isActive: false,
    specialNeed: SpecialNeed.NONE,
    hourlyRate: 120
  }
];

// Generate lessons for the current week dynamically
export function getInitialLessons(): Lesson[] {
  const today = new Date();
  
  // Calculate Monday of the current week
  const day = today.getDay();
  let diffToMonday = 1 - day;
  if (day === 0) diffToMonday = -6; // Sunday
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const getDayAtHour = (dayOffset: number, hour: number, minute: number = 0) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  return [
    // Segunda-feira (Day 0)
    {
      id: 'less-1',
      studentId: 'stud-1',
      date: getDayAtHour(0, 9, 0),
      durationMinutes: 60,
      subject: 'Matemática Aplicada',
      topic: 'Equações de 2º Grau e Geometria Plana',
      status: LessonStatus.COMPLETED
    },
    {
      id: 'less-2',
      studentId: 'stud-2',
      date: getDayAtHour(0, 14, 0),
      durationMinutes: 50,
      subject: 'Língua Portuguesa',
      topic: 'Interpretação Textual e Redação',
      status: LessonStatus.COMPLETED
    },
    // Terça-feira (Day 1)
    {
      id: 'less-3',
      studentId: 'stud-3',
      date: getDayAtHour(1, 10, 0),
      durationMinutes: 60,
      subject: 'Inglês Conversação',
      topic: 'Speaking & Listening - Everyday Topics',
      status: LessonStatus.SCHEDULED
    },
    {
      id: 'less-4',
      studentId: 'stud-4',
      date: getDayAtHour(1, 15, 30),
      durationMinutes: 60,
      subject: 'Física',
      topic: 'Cinemática e Movimento Uniforme',
      status: LessonStatus.SCHEDULED
    },
    // Quarta-feira (Day 2)
    {
      id: 'less-5',
      studentId: 'stud-5',
      date: getDayAtHour(2, 9, 30),
      durationMinutes: 50,
      subject: 'Reforço Geral',
      topic: 'Desenvolvimento Cognitivo e Jogos Lógicos',
      status: LessonStatus.SCHEDULED
    },
    {
      id: 'less-6',
      studentId: 'stud-1',
      date: getDayAtHour(2, 14, 0),
      durationMinutes: 60,
      subject: 'Matemática Aplicada',
      topic: 'Revisão de Exercícios e Dúvidas',
      status: LessonStatus.SCHEDULED
    },
    // Quinta-feira (Day 3)
    {
      id: 'less-7',
      studentId: 'stud-2',
      date: getDayAtHour(3, 11, 0),
      durationMinutes: 50,
      subject: 'História Geral',
      topic: 'Brasil Colônia e Ciclo do Ouro',
      status: LessonStatus.SCHEDULED
    },
    {
      id: 'less-8',
      studentId: 'stud-3',
      date: getDayAtHour(3, 16, 0),
      durationMinutes: 60,
      subject: 'Inglês Conversação',
      topic: 'Grammar Focus - Past Continuous',
      status: LessonStatus.SCHEDULED
    },
    // Sexta-feira (Day 4)
    {
      id: 'less-9',
      studentId: 'stud-4',
      date: getDayAtHour(4, 10, 0),
      durationMinutes: 60,
      subject: 'Química',
      topic: 'Tabela Periódica e Ligações Químicas',
      status: LessonStatus.SCHEDULED
    },
    {
      id: 'less-10',
      studentId: 'stud-5',
      date: getDayAtHour(4, 14, 30),
      durationMinutes: 50,
      subject: 'Reforço Escolar',
      topic: 'Atividades Práticas de Leitura',
      status: LessonStatus.SCHEDULED
    }
  ];
}
