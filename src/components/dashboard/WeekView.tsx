import React from 'react';
import { Calendar } from 'lucide-react';
import { Student, Lesson, LessonStatus } from '../../types';

interface WeekViewProps {
  students: Student[];
  lessons: Lesson[];
}

export const WeekView: React.FC<WeekViewProps> = ({ students, lessons }) => {
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
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Calendar size={20} className="text-purple-500" />
        Visão da Semana
      </h3>

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
                className={`text-center pb-2 mb-2 border-b ${
                  activeToday ? 'border-blue-200' : 'border-slate-200'
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    activeToday ? 'text-blue-600' : 'text-slate-500'
                  }`}
                >
                  {dayNames[dayDate.getDay()]}
                </p>
                <p
                  className={`text-xl font-bold ${
                    activeToday ? 'text-blue-700' : 'text-slate-700'
                  }`}
                >
                  {dayDate.getDate()}
                </p>
              </div>

              {/* Lessons list */}
              <div className="space-y-2 flex-1">
                {dayLessons.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    Sem aulas
                  </p>
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
                        className={`text-xs p-2 rounded border-l-2 shadow-2xs transition-all hover:translate-x-0.5 ${
                          isCompleted
                            ? 'bg-emerald-100 border-emerald-500'
                            : 'bg-white border-blue-400'
                        }`}
                      >
                        <p className="font-bold text-slate-700">{lessonTime}</p>
                        <p
                          className="text-slate-600 truncate font-medium"
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
