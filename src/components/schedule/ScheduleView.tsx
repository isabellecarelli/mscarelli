import React from 'react';
import { Calendar, Clock, Plus, MapPin } from 'lucide-react';
import { Student, Lesson, LessonStatus } from '../../types';

interface ScheduleViewProps {
  lessons: Lesson[];
  students: Student[];
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ lessons, students }) => {
  const sortedLessons = [...lessons].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            Agenda Completa
          </h2>
          <p className="text-slate-500 mt-0.5">
            Visualize e organize todos os seus horários e atendimentos
          </p>
        </div>
        <button
          onClick={() => alert('Agendamento de nova aula')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Agendar Aula
        </button>
      </div>

      {/* Lessons List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-sm">
            Total de Aulas Registradas ({lessons.length})
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {sortedLessons.map((lesson) => {
            const student = students.find((s) => s.id === lesson.studentId);
            const isCompleted = lesson.status === LessonStatus.COMPLETED;
            const lessonDate = new Date(lesson.date);

            return (
              <div
                key={lesson.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg text-center min-w-[75px]">
                    <span className="block text-xs font-bold uppercase text-blue-500">
                      {lessonDate.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </span>
                    <span className="block text-xl font-bold text-blue-700 leading-tight">
                      {lessonDate.getDate()}
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium">
                      {lessonDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-base">
                      {student?.name || 'Aluno'}
                    </h4>
                    <p className="text-sm text-slate-600 font-medium">
                      {lesson.subject || 'Disciplina Geral'} • {lesson.topic || 'Tópico de aula'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {lesson.durationMinutes} minutos
                      </span>
                      {student?.address && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {student.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {lesson.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
