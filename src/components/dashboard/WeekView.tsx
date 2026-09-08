import React from 'react';
import { Calendar, Plus, Edit3 } from 'lucide-react';
import { Student, Lesson, LessonStatus } from '../../types';

interface WeekViewProps {
  students: Student[];
  lessons: Lesson[];
  onEditLesson: (lesson: Lesson) => void;
  onAddLessonAtDate: (date: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  students,
  lessons,
  onEditLesson,
  onAddLessonAtDate
}) => {
  // Determine Monday of current week
  const weekStart = (() => {
    const now = new Date();
    const day = now.getDay();
    let offsetDays = 1 - day;
    if (day === 0) offsetDays = -6; // Sunday
    if (day === 6) offsetDays = 2;  // Saturday -> Next Monday
    const b = new Date(now);
    b.setDate(now.getDate() + offsetDays);
    b.setHours(0, 0, 0, 0);
    return b;
  })();

  // 5 days: Monday through Friday
  const weekDays = Array.from({ length: 5 }, (_, idx) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + idx);
    return d;
  });

  const getLessonsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return lessons
      .filter((l) => l.date.startsWith(dateStr))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const isToday = (date: Date) => {
    const now = new Date();
    return date.toDateString() === now.toDateString();
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Calendar size={20} className="text-purple-500" />
          Visão da Semana
        </h3>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          (Clique nas aulas para editar ou nos dias para adicionar nova aula)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {weekDays.map((dayDate, idx) => {
          const dayLessons = getLessonsForDay(dayDate);
          const activeToday = isToday(dayDate);

          return (
            <div
              key={idx}
              className={`rounded-lg p-3 min-h-[220px] transition-all flex flex-col ${
                activeToday
                  ? 'bg-blue-50/70 border-2 border-blue-400 shadow-sm'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              {/* Day header */}
              <div
                className={`text-center pb-2 mb-2 border-b flex items-center justify-between px-1 ${
                  activeToday ? 'border-blue-200' : 'border-slate-200'
                }`}
              >
                <div>
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider text-left ${
                      activeToday ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {dayNames[dayDate.getDay()]}
                  </p>
                  <p
                    className={`text-xl font-bold text-left leading-none mt-0.5 ${
                      activeToday ? 'text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    {dayDate.getDate()}
                  </p>
                </div>

                <button
                  onClick={() => onAddLessonAtDate(dayDate)}
                  className="p-1 hover:bg-blue-100 rounded text-blue-600 text-xs font-semibold transition-colors"
                  title="Adicionar aula neste dia"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Lessons list */}
              <div className="space-y-2 flex-1">
                {dayLessons.length === 0 ? (
                  <div 
                    onClick={() => onAddLessonAtDate(dayDate)}
                    className="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/60 rounded-lg p-2 transition-colors"
                    title="Clique para agendar aula neste dia"
                  >
                    <p className="text-xs text-slate-400 italic text-center">
                      Sem aulas
                    </p>
                    <span className="text-[10px] text-blue-600 font-medium mt-1">
                      + Agendar
                    </span>
                  </div>
                ) : (
                  dayLessons.map((lesson) => {
                    const student = students.find((s) => s.id === lesson.studentId);
                    const isCompleted = lesson.status === LessonStatus.COMPLETED;
                    const lessonTime = new Date(lesson.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => onEditLesson(lesson)}
                        className={`text-xs p-2 rounded border-l-3 shadow-2xs transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xs group ${
                          isCompleted
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                            : 'bg-white border-blue-400 text-slate-800'
                        }`}
                        title="Clique para editar horário ou dados da aula"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-700">{lessonTime}</p>
                          <Edit3 size={11} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                        </div>
                        <p
                          className="text-slate-600 truncate font-medium mt-0.5"
                          title={student?.name}
                        >
                          {student?.name || 'Aluno'}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
