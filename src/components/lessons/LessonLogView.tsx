import React, { useState } from 'react';
import { 
  CheckCircle2, 
  FileText, 
  Clock, 
  Calendar, 
  User, 
  ArrowRight, 
  Plus, 
  X, 
  Check, 
  BookOpen, 
  AlertCircle 
} from 'lucide-react';
import { Student, Lesson, LessonStatus } from '../../types';

interface LessonLogViewProps {
  students: Student[];
  lessons: Lesson[];
  onSaveLesson: (lesson: Lesson) => void;
}

export const LessonLogView: React.FC<LessonLogViewProps> = ({
  students,
  lessons,
  onSaveLesson
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const now = new Date();

  // Past lessons pending registration (status scheduled but past date)
  const pendingPastLessons = lessons.filter(l => {
    const lessonDate = new Date(l.date);
    return lessonDate < now && l.status === LessonStatus.SCHEDULED;
  });

  // Future scheduled lessons (planning)
  const upcomingLessons = lessons
    .filter(l => {
      const lessonDate = new Date(l.date);
      return lessonDate >= now || l.status === LessonStatus.SCHEDULED;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Past completed lessons for selected student
  const studentHistory = selectedStudentId 
    ? lessons
        .filter(l => l.studentId === selectedStudentId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const handleOpenNewModal = (prefillStudentId?: string) => {
    const todayISO = new Date().toISOString().slice(0, 16);
    setEditingLesson({
      id: `lesson-${Date.now()}`,
      studentId: prefillStudentId || (students[0]?.id || ''),
      date: new Date().toISOString(),
      durationMinutes: 60,
      subject: 'Inglês',
      topic: '',
      homework: '',
      notes: '',
      status: LessonStatus.COMPLETED
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lesson: Lesson) => {
    setEditingLesson({ ...lesson });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !editingLesson.studentId) return;

    const lessonToSave: Lesson = {
      id: editingLesson.id || `lesson-${Date.now()}`,
      studentId: editingLesson.studentId,
      date: editingLesson.date || new Date().toISOString(),
      durationMinutes: editingLesson.durationMinutes || 60,
      subject: editingLesson.subject || 'Inglês',
      topic: editingLesson.topic || 'Conversação & Vocabulário',
      homework: editingLesson.homework || '',
      notes: editingLesson.notes || '',
      status: (editingLesson.status as LessonStatus) || LessonStatus.COMPLETED
    };

    onSaveLesson(lessonToSave);
    setIsModalOpen(false);
    setEditingLesson(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching image.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={28} className="text-emerald-500 flex-shrink-0" />
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
              Diário de Aulas
            </h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Planejamento e Registro de atividades.
          </p>
        </div>

        <button
          onClick={() => handleOpenNewModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <FileText size={18} />
          Registrar Aula Manual
        </button>
      </div>

      {/* Filter Card matching image.png */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
          <User size={20} />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            FILTRAR POR ALUNO (PRIVACIDADE)
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
          >
            <option value="">-- Selecione para ver o histórico --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.level || 'Inglês'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid matching image.png: Left (Pendentes & Próximas) / Right (Histórico) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Section: Pendentes de Registro */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <Clock size={16} className="text-amber-500" />
              PENDENTES DE REGISTRO (PASSADAS)
            </h3>

            {pendingPastLessons.length === 0 ? (
              <div className="bg-white/80 border border-dashed border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400 font-medium">
                Nenhuma aula passada pendente.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPastLessons.map(lesson => {
                  const student = students.find(s => s.id === lesson.studentId);
                  const formattedDate = new Date(lesson.date).toLocaleDateString('pt-BR');
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleOpenEditModal(lesson)}
                      className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-amber-500 border border-slate-100 flex items-center justify-between hover:shadow-md cursor-pointer transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">
                          {student?.name || 'Aluno'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formattedDate} • {lesson.durationMinutes} min
                        </p>
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          Aguardando registro de conteúdo trabalhado
                        </p>
                      </div>
                      <ArrowRight size={18} className="text-amber-500" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Próximas Aulas (Planejamento) */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-blue-500" />
              PRÓXIMAS AULAS (PLANEJAMENTO)
            </h3>

            {upcomingLessons.length === 0 ? (
              <div className="bg-white/80 border border-dashed border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400 font-medium">
                Nenhuma aula futura agendada.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingLessons.map(lesson => {
                  const student = students.find(s => s.id === lesson.studentId);
                  const formattedDate = new Date(lesson.date).toLocaleDateString('pt-BR');
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (student) setSelectedStudentId(student.id);
                        handleOpenEditModal(lesson);
                      }}
                      className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-blue-500 border border-slate-100 flex items-center justify-between hover:shadow-md cursor-pointer transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">
                          {student?.name || 'Aluno'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formattedDate}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {lesson.topic || 'Matéria a definir'}
                        </p>
                      </div>
                      <ArrowRight size={18} className="text-blue-500" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (lg:col-span-6) */}
        <div className="lg:col-span-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-emerald-500" />
            HISTÓRICO DO ALUNO
          </h3>

          {!selectedStudent ? (
            <div className="bg-white rounded-xl border border-slate-100 p-12 min-h-[380px] flex flex-col items-center justify-center text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-3">
                <User size={32} />
              </div>
              <p className="text-sm text-slate-400 max-w-[220px] leading-relaxed">
                Selecione um aluno acima para visualizar o histórico de aulas.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
              {/* Selected Student Card */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-lg flex items-center justify-center">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base leading-snug">
                      {selectedStudent.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Nível: <span className="font-semibold text-blue-600">{selectedStudent.level}</span> • {studentHistory.length} aulas registradas
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenNewModal(selectedStudent.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Novo Registro
                </button>
              </div>

              {/* Chronological lesson history */}
              {studentHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Nenhum registro de aula para este aluno ainda.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {studentHistory.map(histLesson => {
                    const isDone = histLesson.status === LessonStatus.COMPLETED;
                    const lDate = new Date(histLesson.date);
                    return (
                      <div 
                        key={histLesson.id}
                        onClick={() => handleOpenEditModal(histLesson)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs ${
                          isDone 
                            ? 'bg-emerald-50/40 border-emerald-200' 
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-slate-800">
                            {lDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às {lDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isDone ? 'bg-emerald-200 text-emerald-800' : 'bg-blue-200 text-blue-800'
                          }`}>
                            {histLesson.status}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-slate-700">
                          {histLesson.topic || 'Conversação e revisão geral'}
                        </p>

                        {histLesson.homework && (
                          <div className="mt-2 text-xs bg-white/80 p-2.5 rounded-lg border border-slate-100 text-slate-600">
                            <span className="font-bold text-slate-700">Lição de Casa: </span>
                            {histLesson.homework}
                          </div>
                        )}

                        {histLesson.notes && (
                          <p className="mt-1.5 text-xs text-slate-500 italic">
                            Obs: {histLesson.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Registrar / Editar Aula */}
      {isModalOpen && editingLesson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-600" />
                {editingLesson.id ? 'Registro de Aula Pedagógica' : 'Registrar Aula'}
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="">Selecione o aluno...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="5"
                    value={editingLesson.durationMinutes || 60}
                    onChange={(e) => setEditingLesson({ ...editingLesson, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Status da Aula
                </label>
                <select
                  value={editingLesson.status || LessonStatus.COMPLETED}
                  onChange={(e) => setEditingLesson({ ...editingLesson, status: e.target.value as LessonStatus })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value={LessonStatus.COMPLETED}>Realizada</option>
                  <option value={LessonStatus.SCHEDULED}>Agendada</option>
                  <option value={LessonStatus.CANCELLED_CHARGED}>Cancelada (C/ Cobrança)</option>
                  <option value={LessonStatus.CANCELLED_FREE}>Cancelada (S/ Cobrança)</option>
                  <option value={LessonStatus.POSTPONED}>Adiada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Conteúdo / Tópico Trabalhado
                </label>
                <input
                  type="text"
                  placeholder="Ex: Present Perfect vs Simple Past, Pronunciation drill"
                  value={editingLesson.topic || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, topic: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Lição de Casa (Homework)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Exercícios 4 e 5 da pág. 28 + gravar áudio de 1 min sobre o final de semana"
                  value={editingLesson.homework || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, homework: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Observações Pedagógicas
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Aluno demonstrou evolução na fluência, reforçar conectivos na próxima aula"
                  value={editingLesson.notes || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  <Check size={16} />
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
