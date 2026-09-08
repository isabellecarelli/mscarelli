import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles,
  X, 
  Trash2, 
  Check, 
  AlertCircle,
  CalendarDays 
} from 'lucide-react';
import { Student, Lesson, LessonStatus } from '../../types';
import { db } from '../../services/db';

interface ScheduleViewProps {
  lessons: Lesson[];
  students: Student[];
  onSaveLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onRefreshLessons?: () => void;
}

type CalendarViewMode = 'week' | 'day' | 'month';

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  lessons,
  students,
  onSaveLesson,
  onDeleteLesson,
  onRefreshLessons
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Time slots strictly from 08:00 to 21:00
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  // Week calculation (Monday start)
  const getWeekDays = (baseDate: Date) => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  };

  const weekDays = getWeekDays(currentDate);

  const navigate = (direction: number) => {
    const next = new Date(currentDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() + direction * 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() + direction);
    } else if (viewMode === 'month') {
      next.setMonth(next.getMonth() + direction);
    }
    setCurrentDate(next);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // --- GENERATE RECURRING LESSONS AUTOMATICALLY ---
  const handleGenerateMonthLessons = () => {
    const result = db.generateRecurringLessonsForMonth(currentDate);
    if (onRefreshLessons) {
      onRefreshLessons();
    }
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (result.createdCount > 0) {
      setNotification(`🎉 ${result.createdCount} aulas geradas com sucesso para ${monthName}! (${result.existingCount} já existiam e foram mantidas sem duplicação)`);
    } else if (result.existingCount > 0) {
      setNotification(`ℹ️ Todas as aulas dos alunos recorrentes já estavam criadas para ${monthName} (${result.existingCount} verificadas).`);
    } else {
      setNotification(`ℹ️ Nenhum aluno com agenda padrão recorrente cadastrado no momento. Cadastre alunos com recorrência para gerar automaticamente.`);
    }

    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  const handleOpenNewLesson = (prefillDate?: Date, prefillHour?: number) => {
    let dateObj = prefillDate ? new Date(prefillDate) : new Date(currentDate);
    if (prefillHour !== undefined) {
      dateObj.setHours(prefillHour, 0, 0, 0);
    } else {
      dateObj.setHours(10, 0, 0, 0);
    }

    // Default to first active student
    const defaultStudent = students.find(s => s.isActive) || students[0];

    setEditingLesson({
      id: `lesson-${Date.now()}`,
      studentId: defaultStudent?.id || '',
      date: dateObj.toISOString(),
      durationMinutes: 60,
      subject: 'Inglês',
      topic: 'Aula Regular',
      status: LessonStatus.SCHEDULED,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: Lesson, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingLesson({ ...lesson });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !editingLesson.studentId) return;

    const student = students.find(s => s.id === editingLesson.studentId);

    const lessonToSave: Lesson = {
      id: editingLesson.id || `lesson-${Date.now()}`,
      studentId: editingLesson.studentId,
      date: editingLesson.date || new Date().toISOString(),
      durationMinutes: Number(editingLesson.durationMinutes) || 60,
      subject: editingLesson.subject || 'Inglês',
      topic: editingLesson.topic || 'Aula Regular',
      status: (editingLesson.status as LessonStatus) || LessonStatus.SCHEDULED,
      notes: editingLesson.notes || '',
      homework: editingLesson.homework || '',
      price: student?.billingModel === 'POR_HORA' ? student.billingAmount : undefined
    };

    onSaveLesson(lessonToSave);
    setIsModalOpen(false);
    setEditingLesson(null);
  };

  const handleDelete = () => {
    if (editingLesson?.id) {
      if (confirm('Deseja realmente remover esta aula da agenda?')) {
        onDeleteLesson(editingLesson.id);
        setIsModalOpen(false);
        setEditingLesson(null);
      }
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4">
      {/* Notification Toast */}
      {notification && (
        <div className="bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-md flex items-center justify-between animate-fade-in">
          <span>{notification}</span>
          <button 
            onClick={() => setNotification(null)}
            className="text-white/80 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Google Calendar Header Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
          >
            Hoje
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
              title="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
              title="Próximo"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-800 tracking-tight capitalize ml-2">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* BOTÃO REQUERIDO: Gerar aulas do mês automaticamente */}
          <button
            onClick={handleGenerateMonthLessons}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:scale-105"
            title="Gera todas as aulas do mês atual para os alunos com agenda padrão recorrente, sem duplicar horários existentes"
          >
            <Sparkles size={16} />
            Gerar aulas do mês automaticamente
          </button>

          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
          </div>

          <button
            onClick={() => handleOpenNewLesson()}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} />
            Nova Aula
          </button>
        </div>
      </div>

      {/* VIEW: WEEK (Google Calendar Time Grid: 08:00 - 21:00) */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header Days Row */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10 text-center text-xs">
            <div className="p-3 font-semibold text-slate-400 border-r border-slate-200">
              Horário
            </div>
            {weekDays.map((day, idx) => {
              const active = isToday(day);
              return (
                <div
                  key={idx}
                  className={`p-3 border-r border-slate-200 last:border-r-0 ${
                    active ? 'bg-blue-50/60' : ''
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase text-slate-500">
                    {dayNames[day.getDay()]}
                  </p>
                  <div className="flex justify-center mt-0.5">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-800'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Grid Scrollable Area (08:00 to 21:00) */}
          <div className="max-h-[680px] overflow-y-auto divide-y divide-slate-100">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[64px] relative">
                {/* Time Axis Label */}
                <div className="p-2 text-right pr-3 text-xs font-semibold text-slate-400 border-r border-slate-200 bg-slate-50/40 select-none">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Day Columns for this hour */}
                {weekDays.map((day, dayIdx) => {
                  const dayStr = day.toISOString().split('T')[0];
                  // Find lessons matching this day and hour
                  const slotLessons = lessons.filter((l) => {
                    const lDate = new Date(l.date);
                    return (
                      l.date.startsWith(dayStr) &&
                      lDate.getHours() === hour
                    );
                  });

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => handleOpenNewLesson(day, hour)}
                      className="border-r border-slate-100 last:border-r-0 p-1 relative hover:bg-blue-50/20 cursor-pointer transition-colors group"
                      title={`Clique para agendar aula às ${hour}:00`}
                    >
                      {/* Plus icon on hover for quick add */}
                      <span className="hidden group-hover:flex absolute top-1 right-1 text-slate-300 group-hover:text-blue-500">
                        <Plus size={12} />
                      </span>

                      {/* Render lessons inside this hour slot */}
                      <div className="space-y-1">
                        {slotLessons.map((lesson) => {
                          const student = students.find((s) => s.id === lesson.studentId);
                          const isCompleted = lesson.status === LessonStatus.COMPLETED;
                          const isCancelled = lesson.status.includes('Cancelada');
                          const lessonTime = new Date(lesson.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <div
                              key={lesson.id}
                              onClick={(e) => handleOpenEditLesson(lesson, e)}
                              className={`p-1.5 rounded-lg border-l-3 text-xs shadow-2xs cursor-pointer transition-all hover:scale-[1.02] ${
                                isCompleted
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                                  : isCancelled
                                  ? 'bg-rose-50 border-rose-400 text-rose-800 line-through'
                                  : 'bg-blue-50 border-blue-500 text-blue-900'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span className="truncate">{student?.name || 'Aluno'}</span>
                                <span className="text-[10px] opacity-75 font-normal ml-1">
                                  {lessonTime}
                                </span>
                              </div>
                              <p className="text-[10px] truncate opacity-80 mt-0.5">
                                {lesson.topic || 'Inglês'} ({lesson.durationMinutes}m)
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: DAY */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => handleOpenNewLesson(currentDate)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              + Adicionar Aula Hoje
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {hours.map((hour) => {
              const dayStr = currentDate.toISOString().split('T')[0];
              const slotLessons = lessons.filter((l) => {
                const lDate = new Date(l.date);
                return l.date.startsWith(dayStr) && lDate.getHours() === hour;
              });

              return (
                <div 
                  key={hour} 
                  onClick={() => handleOpenNewLesson(currentDate, hour)}
                  className="flex items-start p-3 hover:bg-slate-50 cursor-pointer min-h-[60px]"
                >
                  <span className="w-20 font-bold text-xs text-slate-400">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 space-y-2">
                    {slotLessons.map((lesson) => {
                      const student = students.find((s) => s.id === lesson.studentId);
                      return (
                        <div
                          key={lesson.id}
                          onClick={(e) => handleOpenEditLesson(lesson, e)}
                          className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-bold text-blue-950 text-sm">{student?.name}</h4>
                            <p className="text-xs text-blue-800">{lesson.topic} • {lesson.durationMinutes} minutos</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-200 text-blue-800">
                            {lesson.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: MONTH */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase text-slate-400">
            {dayNames.map((n, i) => <div key={i} className="py-1">{n}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, idx) => {
              const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const offset = firstDayOfMonth.getDay();
              const dayNumber = idx - offset + 1;
              const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
              const isCurrentMonth = dateObj.getMonth() === currentDate.getMonth();
              const dateStr = dateObj.toISOString().split('T')[0];
              const dayLessons = lessons.filter(l => l.date.startsWith(dateStr));

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenNewLesson(dateObj)}
                  className={`min-h-[90px] p-2 border rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:border-blue-300 ${
                    isToday(dateObj)
                      ? 'border-blue-500 bg-blue-50/40'
                      : isCurrentMonth
                      ? 'border-slate-100 bg-white'
                      : 'border-slate-100 bg-slate-50/50 opacity-40'
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday(dateObj) ? 'text-blue-600' : 'text-slate-700'}`}>
                    {dateObj.getDate()}
                  </span>
                  <div className="space-y-1 my-1 overflow-hidden">
                    {dayLessons.slice(0, 2).map(l => (
                      <div
                        key={l.id}
                        onClick={(e) => handleOpenEditLesson(l, e)}
                        className="truncate text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded"
                      >
                        {new Date(l.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {students.find(s=>s.id===l.studentId)?.name}
                      </div>
                    ))}
                    {dayLessons.length > 2 && (
                      <span className="text-[10px] text-slate-400 font-medium">+{dayLessons.length - 2} mais</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Nova / Editar Aula */}
      {isModalOpen && editingLesson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon size={20} className="text-blue-600" />
                {editingLesson.id && lessons.some(l => l.id === editingLesson.id) ? 'Editar Aula' : 'Nova Aula'}
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
                  Aluno *
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
                    Data e Horário *
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
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={50}>50 minutos</option>
                    <option value={60}>60 minutos (1h)</option>
                    <option value={90}>90 minutos (1h30)</option>
                    <option value={120}>120 minutos (2h)</option>
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
                  Tema / Conteúdo da Aula
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conversação sobre viagens, Phrasal Verbs"
                  value={editingLesson.topic || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, topic: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Anotações para a aula..."
                  value={editingLesson.notes || ''}
                  onChange={(e) => setEditingLesson({ ...editingLesson, notes: e.target.value })}
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
                    Excluir Aula
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
                    Salvar
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
