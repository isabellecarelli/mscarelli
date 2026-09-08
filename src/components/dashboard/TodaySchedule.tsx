import React from 'react';
import { CalendarCheck, MapPin } from 'lucide-react';
import { Student, Lesson, LessonStatus, ViewType } from '../../types';

interface TodayScheduleProps {
  todayLessons: Lesson[];
  students: Student[];
  onNavigate?: (view: ViewType) => void;
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({
  todayLessons,
  students,
  onNavigate
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <CalendarCheck size={20} className="text-blue-500" />
        Agenda Detalhada de Hoje
      </h3>

      {todayLessons.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 italic mb-2">
            Você está livre hoje! Aproveite para descansar ou planejar.
          </p>
          <button
            onClick={() => onNavigate?.('schedule')}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            Ver agenda completa
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {todayLessons.map((lesson) => {
            const student = students.find((s) => s.id === lesson.studentId);
            const isCompleted = lesson.status === LessonStatus.COMPLETED;
            const lessonTime = new Date(lesson.date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={lesson.id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border-l-4 transition-all ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-50/60'
                    : 'border-blue-500 bg-slate-50'
                }`}
              >
                <div className="flex gap-4 items-start">
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold text-slate-700">
                      {lessonTime}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {lesson.durationMinutes} min
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800">
                      {student?.name || 'Aluno não informado'}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {lesson.subject || 'A definir'} • {lesson.topic || 'Sem tópico definido'}
                    </p>
                    {student?.address && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <MapPin size={12} className="flex-shrink-0" />
                        <span>{student.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-3 justify-end">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isCompleted
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {isCompleted ? 'Realizada' : 'Pendente'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
