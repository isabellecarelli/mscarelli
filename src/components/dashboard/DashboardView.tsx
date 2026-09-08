import React, { useState } from 'react';
import { StatCards } from './StatCards';
import { TodaySchedule } from './TodaySchedule';
import { WeekView } from './WeekView';
import { Student, Lesson, LessonStatus, ViewType } from '../../types';
import { Calendar as CalendarIcon, X, Trash2, Check } from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  lessons: Lesson[];
  onNavigate?: (view: ViewType) => void;
  onSaveLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  lessons,
  onNavigate,
  onSaveLesson,
  onDeleteLesson
}) => {
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLessons = lessons
    .filter((l) => l.date.startsWith(todayStr))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const activeStudentsCount = students.filter((s) => s.isActive).length;

  const todayLessonHours = todayLessons.reduce(
    (acc, cur) => acc + (cur.status !== LessonStatus.CANCELLED_FREE ? cur.durationMinutes / 60 : 0),
    0
  );

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson({ ...lesson });
    setIsModalOpen(true);
  };

  const handleAddLessonAtDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(14, 0, 0, 0);
    setEditingLesson({
      id: `lesson-${Date.now()}`,
      studentId: students[0]?.id || '',
      date: d.toISOString(),
      durationMinutes: 60,
      subject: 'Inglês',
      topic: 'Conversação & Gramática',
      status: LessonStatus.SCHEDULED
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !editingLesson.studentId) return;

    const lessonToSave: Lesson = {
      id: editingLesson.id || `lesson-${Date.now()}`,
      studentId: editingLesson.studentId,
      date: editingLesson.date || new Date().toISOString(),
      durationMinutes: Number(editingLesson.durationMinutes) || 60,
      subject: editingLesson.subject || 'Inglês',
      topic: editingLesson.topic || 'Aula Regular',
      status: (editingLesson.status as LessonStatus) || LessonStatus.SCHEDULED,
      notes: editingLesson.notes || '',
      homework: editingLesson.homework || ''
    };

    onSaveLesson(lessonToSave);
    setIsModalOpen(false);
    setEditingLesson(null);
  };

  const handleDelete = () => {
    if (editingLesson?.id) {
      if (confirm('Deseja realmente excluir esta aula?')) {
        onDeleteLesson(editingLesson.id);
        setIsModalOpen(false);
        setEditingLesson(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            Visão do Dia
          </h2>
          <p className="text-slate-500 capitalize mt-0.5">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <StatCards
        totalStudents={activeStudentsCount}
        todayLessonHours={todayLessonHours}
      />

      {/* Detailed Today Schedule (Clickable & Editable) */}
      <TodaySchedule
        todayLessons={todayLessons}
        students={students}
        onNavigate={onNavigate}
        onEditLesson={handleEditLesson}
      />

      {/* 5-Day Week Calendar View (Clickable & Editable) */}
      <WeekView
        students={students}
        lessons={lessons}
        onEditLesson={handleEditLesson}
        onAddLessonAtDate={handleAddLessonAtDate}
      />

      {/* Modal for editing lesson from Dashboard */}
      {isModalOpen && editingLesson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon size={20} className="text-blue-600" />
                {editingLesson.id && lessons.some(l => l.id === editingLesson.id) ? 'Editar Horário e Aula' : 'Agendar Aula'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Aluno
                </label>
                <select
                  required
                  value={editingLesson.studentId || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, studentId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="">Selecione o aluno...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.level || 'Inglês'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Data e Horário
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editingLesson.date ? new Date(editingLesson.date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingLesson({ ...editingLesson, date: new Date(e.target.value).toISOString() })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Duração
                  </label>
                  <select
                    value={editingLesson.durationMinutes || 60}
                    onChange={(e) => setEditingLesson({ ...editingLesson, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={50}>50 min</option>
                    <option value={60}>60 min (1h)</option>
                    <option value={90}>90 min (1h30)</option>
                    <option value={120}>120 min (2h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Status
                </label>
                <select
                  value={editingLesson.status || LessonStatus.SCHEDULED}
                  onChange={(e) => setEditingLesson({ ...editingLesson, status: e.target.value as LessonStatus })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value={LessonStatus.SCHEDULED}>Agendada</option>
                  <option value={LessonStatus.COMPLETED}>Realizada</option>
                  <option value={LessonStatus.POSTPONED}>Adiada</option>
                  <option value={LessonStatus.CANCELLED_CHARGED}>Cancelada (C/ Cobrança)</option>
                  <option value={LessonStatus.CANCELLED_FREE}>Cancelada (S/ Cobrança)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Tema / Tópico
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conversação sobre viagens, Phrasal Verbs"
                  value={editingLesson.topic || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, topic: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                {editingLesson.id && lessons.some(l => l.id === editingLesson.id) ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-xs font-semibold"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                  >
                    <Check size={16} />
                    Salvar Horário
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
