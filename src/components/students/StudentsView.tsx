import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Clock, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Target, 
  GraduationCap, 
  ExternalLink,
  Calendar,
  DollarSign,
  AlertCircle,
  Save,
  Link as LinkIcon
} from 'lucide-react';
import { 
  Student, 
  EnglishLevel, 
  BillingModel, 
  RecurringScheduleSlot,
  StudyPlanner, 
  ClassPlan 
} from '../../types';
import { db } from '../../services/db';

interface StudentsViewProps {
  students: Student[];
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

const ENGLISH_LEVELS: EnglishLevel[] = [
  'Iniciante (A1)',
  'Básico (A2)',
  'Intermediário (B1)',
  'Intermediário Superior (B2)',
  'Avançado (C1)',
  'Fluente / Proficiente (C2)',
  'Inglês para Negócios',
  'Preparatório (IELTS/TOEFL)'
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' }
];

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onSaveStudent,
  onDeleteStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);

  // Fallback Internal Modal if no external URL
  const [isStudyPlannerOpen, setIsStudyPlannerOpen] = useState(false);
  const [currentStudyPlanner, setCurrentStudyPlanner] = useState<StudyPlanner | null>(null);
  const [activePlannerStudent, setActivePlannerStudent] = useState<Student | null>(null);

  const [isClassPlanOpen, setIsClassPlanOpen] = useState(false);
  const [currentClassPlan, setCurrentClassPlan] = useState<ClassPlan | null>(null);
  const [activePlanStudent, setActivePlanStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      s.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.defaultScheduleText && s.defaultScheduleText.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterActive === 'active') return matchesSearch && s.isActive;
    if (filterActive === 'inactive') return matchesSearch && !s.isActive;
    return matchesSearch;
  });

  // --- HELPER TO FORMAT RECURRING SCHEDULE TEXT ---
  const formatRecurringText = (slots: RecurringScheduleSlot[]): string => {
    if (!slots || slots.length === 0) return 'Horário Flexível / Avulso';
    const parts = slots.map(slot => {
      const dayObj = DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek);
      return `${dayObj ? dayObj.short : 'Dia'} às ${slot.time} (${slot.durationMinutes}min)`;
    });
    return parts.join(', ');
  };

  // --- STUDENT MODAL HANDLERS ---
  const handleOpenNewStudent = () => {
    const initialSlots: RecurringScheduleSlot[] = [
      { dayOfWeek: 1, time: '14:00', durationMinutes: 60 },
      { dayOfWeek: 3, time: '14:00', durationMinutes: 60 }
    ];

    setEditingStudent({
      id: `student-${Date.now()}`,
      name: '',
      phone: '',
      level: 'Básico (A2)',
      billingModel: 'MENSALIDADE_FIXA',
      billingAmount: 480,
      hasRecurringSchedule: true,
      recurringSlots: initialSlots,
      defaultScheduleText: formatRecurringText(initialSlots),
      studyPlannerUrl: '',
      classPlanUrl: '',
      isActive: true,
      notes: '',
      createdAt: new Date().toISOString()
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent({
      ...student,
      recurringSlots: student.recurringSlots ? [...student.recurringSlots] : []
    });
    setIsStudentModalOpen(true);
  };

  const handleAddSlot = () => {
    if (!editingStudent) return;
    const currentSlots = editingStudent.recurringSlots || [];
    const newSlot: RecurringScheduleSlot = {
      dayOfWeek: 2, // Terça
      time: '15:00',
      durationMinutes: 60
    };
    const updatedSlots = [...currentSlots, newSlot];
    setEditingStudent({
      ...editingStudent,
      recurringSlots: updatedSlots,
      defaultScheduleText: formatRecurringText(updatedSlots)
    });
  };

  const handleRemoveSlot = (index: number) => {
    if (!editingStudent || !editingStudent.recurringSlots) return;
    const updatedSlots = editingStudent.recurringSlots.filter((_, i) => i !== index);
    setEditingStudent({
      ...editingStudent,
      recurringSlots: updatedSlots,
      defaultScheduleText: formatRecurringText(updatedSlots)
    });
  };

  const handleUpdateSlot = (index: number, field: keyof RecurringScheduleSlot, value: any) => {
    if (!editingStudent || !editingStudent.recurringSlots) return;
    const updatedSlots = [...editingStudent.recurringSlots];
    updatedSlots[index] = {
      ...updatedSlots[index],
      [field]: value
    };
    setEditingStudent({
      ...editingStudent,
      recurringSlots: updatedSlots,
      defaultScheduleText: formatRecurringText(updatedSlots)
    });
  };

  const handleSaveStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.name) return;

    const slots = editingStudent.hasRecurringSchedule ? (editingStudent.recurringSlots || []) : [];
    const scheduleText = editingStudent.hasRecurringSchedule 
      ? formatRecurringText(slots) 
      : 'Horário Flexível / Avulso';

    const studentToSave: Student = {
      id: editingStudent.id || `student-${Date.now()}`,
      name: editingStudent.name.trim(),
      phone: editingStudent.phone || '',
      level: editingStudent.level || 'Básico (A2)',
      billingModel: editingStudent.billingModel || 'MENSALIDADE_FIXA',
      billingAmount: Number(editingStudent.billingAmount) || (editingStudent.billingModel === 'MENSALIDADE_FIXA' ? 480 : 120),
      hasRecurringSchedule: !!editingStudent.hasRecurringSchedule,
      recurringSlots: slots,
      defaultScheduleText: scheduleText,
      studyPlannerUrl: editingStudent.studyPlannerUrl?.trim() || '',
      classPlanUrl: editingStudent.classPlanUrl?.trim() || '',
      isActive: editingStudent.isActive !== false,
      notes: editingStudent.notes || '',
      createdAt: editingStudent.createdAt || new Date().toISOString()
    };

    onSaveStudent(studentToSave);
    setIsStudentModalOpen(false);
    setEditingStudent(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir o aluno "${name}"? Todas as aulas e registros vinculados serão removidos.`)) {
      onDeleteStudent(id);
    }
  };

  // --- EXTERNAL LINKS OR MODAL OPENERS ---
  const handleOpenStudyPlanner = (student: Student) => {
    if (student.studyPlannerUrl && student.studyPlannerUrl.startsWith('http')) {
      window.open(student.studyPlannerUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Abre modal interno se não tiver link cadastrado
      setActivePlannerStudent(student);
      const planner = db.getStudyPlanner(student.id);
      setCurrentStudyPlanner(planner);
      setIsStudyPlannerOpen(true);
    }
  };

  const handleOpenClassPlan = (student: Student) => {
    if (student.classPlanUrl && student.classPlanUrl.startsWith('http')) {
      window.open(student.classPlanUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Abre modal interno se não tiver link cadastrado
      setActivePlanStudent(student);
      const plan = db.getClassPlan(student.id);
      setCurrentClassPlan(plan);
      setIsClassPlanOpen(true);
    }
  };

  const handleSaveStudyPlanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudyPlanner) return;
    db.saveStudyPlanner(currentStudyPlanner);
    setIsStudyPlannerOpen(false);
  };

  const handleSaveClassPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClassPlan) return;
    db.saveClassPlan(currentClassPlan);
    setIsClassPlanOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users size={28} className="text-blue-600" />
            Alunos de Inglês
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Gestão de alunos, horários padrões de aula, Study Planner e Class Plan
          </p>
        </div>

        <button
          onClick={handleOpenNewStudent}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus size={18} />
          Cadastrar Aluno
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, nível..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setFilterActive('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterActive === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({students.length})
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterActive === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ativos ({students.filter((s) => s.isActive).length})
          </button>
          <button
            onClick={() => setFilterActive('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterActive === 'inactive'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Inativos ({students.filter((s) => !s.isActive).length})
          </button>
        </div>
      </div>

      {/* TABLE: Lista de Alunos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Nenhum aluno cadastrado</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
              Comece cadastrando seu primeiro aluno de inglês para liberar o diário de aulas, agenda e controle financeiro.
            </p>
            <button
              onClick={handleOpenNewStudent}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm"
            >
              <Plus size={18} />
              Criar Primeiro Aluno
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-4">Horários Padrões</th>
                  <th className="py-3.5 px-4">Modelo de Cobrança</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Study Planner</th>
                  <th className="py-3.5 px-4 text-center">Class Plan</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Aluno info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{student.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-semibold border border-blue-100">
                              {student.level}
                            </span>
                            {student.phone && (
                              <span className="text-slate-400 text-xs flex items-center gap-1">
                                <Phone size={11} />
                                {student.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Coluna: Horários Padrões de Aula */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                        <Clock size={14} className="text-slate-400 flex-shrink-0" />
                        <span className={student.hasRecurringSchedule ? 'text-slate-800' : 'text-slate-400 italic'}>
                          {student.defaultScheduleText || 'Horário Flexível / Avulso'}
                        </span>
                      </div>
                    </td>

                    {/* Coluna: Modelo de Cobrança */}
                    <td className="py-3.5 px-4">
                      {student.billingModel === 'MENSALIDADE_FIXA' ? (
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Mensalidade Fixa
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                            R$ {student.billingAmount.toFixed(2)} • Venc. dia 10
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Por hora
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                            R$ {student.billingAmount.toFixed(2)}/h • Pós-aula
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          student.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {student.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    {/* Coluna: Study Planner */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenStudyPlanner(student)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${
                          student.studyPlannerUrl
                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                            : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                        }`}
                        title={student.studyPlannerUrl ? `Abrir link externo: ${student.studyPlannerUrl}` : 'Visualizar Study Planner do aluno'}
                      >
                        <Target size={14} />
                        <span>Study Planner</span>
                        {student.studyPlannerUrl && <ExternalLink size={12} className="opacity-80" />}
                      </button>
                    </td>

                    {/* Coluna: Class Plan */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenClassPlan(student)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${
                          student.classPlanUrl
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                        title={student.classPlanUrl ? `Abrir link externo: ${student.classPlanUrl}` : 'Visualizar Class Plan do aluno'}
                      >
                        <GraduationCap size={14} />
                        <span>Class Plan</span>
                        {student.classPlanUrl && <ExternalLink size={12} className="opacity-80" />}
                      </button>
                    </td>

                    {/* Coluna: Ações */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar informações do aluno"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir aluno"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CADASTRAR / EDITAR ALUNO */}
      {isStudentModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[92vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                {students.some(s => s.id === editingStudent.id) ? 'Editar Aluno de Inglês' : 'Novo Aluno de Inglês'}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStudentSubmit} className="space-y-5">
              {/* Informações Básicas (SEM E-mail e SEM Endereço) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Nome Completo do Aluno *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Beatriz Lima"
                    value={editingStudent.name || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-8888"
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Nível de Inglês
                  </label>
                  <select
                    value={editingStudent.level || 'Básico (A2)'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, level: e.target.value as EnglishLevel })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {ENGLISH_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CAIXA: MODELO DE COBRANÇA */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <DollarSign size={16} className="text-emerald-600" />
                  Modelo de Cobrança *
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opção: Mensalidade Fixa */}
                  <label 
                    onClick={() => setEditingStudent({ 
                      ...editingStudent, 
                      billingModel: 'MENSALIDADE_FIXA',
                      billingAmount: editingStudent.billingAmount || 480
                    })}
                    className={`p-3.5 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                      editingStudent.billingModel === 'MENSALIDADE_FIXA'
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm">Mensalidade Fixa</span>
                      <input
                        type="radio"
                        name="billingModel"
                        checked={editingStudent.billingModel === 'MENSALIDADE_FIXA'}
                        onChange={() => {}}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded w-fit">
                      Vencimento todo dia 10
                    </span>
                    <p className="text-xs text-slate-500 mt-2">
                      Cobrança em valor fixo mensal independentemente da quantidade de aulas daquele mês.
                    </p>
                  </label>

                  {/* Opção: Por Hora */}
                  <label 
                    onClick={() => setEditingStudent({ 
                      ...editingStudent, 
                      billingModel: 'POR_HORA',
                      billingAmount: editingStudent.billingAmount || 120
                    })}
                    className={`p-3.5 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                      editingStudent.billingModel === 'POR_HORA'
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm">Por hora</span>
                      <input
                        type="radio"
                        name="billingModel"
                        checked={editingStudent.billingModel === 'POR_HORA'}
                        onChange={() => {}}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded w-fit">
                      Aluno paga sempre depois da aula
                    </span>
                    <p className="text-xs text-slate-500 mt-2">
                      Calculado multiplicando a quantidade de aulas dadas pelo valor de cada hora/aula.
                    </p>
                  </label>
                </div>

                {/* Input do Valor */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {editingStudent.billingModel === 'MENSALIDADE_FIXA' 
                      ? 'Valor da Mensalidade Fixa (R$ / mês)' 
                      : 'Valor por Hora de Aula (R$ / hora)'}
                  </label>
                  <div className="relative w-full sm:w-60">
                    <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">R$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="10"
                      value={editingStudent.billingAmount || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, billingAmount: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* CAIXA: AGENDA PADRÃO (RECORRÊNCIA) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <Calendar size={16} className="text-blue-600" />
                    Agenda Padrão (Recorrência Semanal)
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasRecurringSchedule"
                      checked={!!editingStudent.hasRecurringSchedule}
                      onChange={(e) => setEditingStudent({ 
                        ...editingStudent, 
                        hasRecurringSchedule: e.target.checked 
                      })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="hasRecurringSchedule" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Possui horários fixos na semana
                    </label>
                  </div>
                </div>

                {editingStudent.hasRecurringSchedule ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-slate-500">
                      Adicione os dias e horários fixos das aulas. Ao salvar, as próximas aulas do mês já aparecerão na Agenda e Diário de Aulas:
                    </p>

                    {/* Slots List */}
                    <div className="space-y-2">
                      {(editingStudent.recurringSlots || []).map((slot, index) => (
                        <div key={index} className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                          {/* Dia da Semana */}
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Dia</label>
                            <select
                              value={slot.dayOfWeek}
                              onChange={(e) => handleUpdateSlot(index, 'dayOfWeek', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800"
                            >
                              {DAYS_OF_WEEK.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Horário */}
                          <div className="w-28">
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Horário</label>
                            <input
                              type="time"
                              required
                              value={slot.time}
                              onChange={(e) => handleUpdateSlot(index, 'time', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800"
                            />
                          </div>

                          {/* Duração */}
                          <div className="w-32">
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Duração</label>
                            <select
                              value={slot.durationMinutes}
                              onChange={(e) => handleUpdateSlot(index, 'durationMinutes', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800"
                            >
                              <option value={30}>30 min</option>
                              <option value={45}>45 min</option>
                              <option value={50}>50 min</option>
                              <option value={60}>60 min (1h)</option>
                              <option value={90}>90 min (1h30)</option>
                              <option value={120}>120 min (2h)</option>
                            </select>
                          </div>

                          {/* Botão Remover Slot */}
                          <div className="pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(index)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Remover horário"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus size={14} />
                      Adicionar outro dia/horário na semana
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Aluno sem agenda padrão:</span> As aulas serão marcadas manualmente na Agenda pela professora conforme a demanda do aluno.
                  </div>
                )}
              </div>

              {/* LINKS EXTERNOS (STUDY PLANNER & CLASS PLAN) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                    <LinkIcon size={13} className="text-purple-600" />
                    Link do Study Planner (Google Docs / Notion)
                  </label>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/..."
                    value={editingStudent.studyPlannerUrl || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, studyPlannerUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  />
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    O botão na lista de alunos abrirá este link em nova aba.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                    <LinkIcon size={13} className="text-blue-600" />
                    Link do Class Plan (Notion / Drive)
                  </label>
                  <input
                    type="url"
                    placeholder="https://notion.so/..."
                    value={editingStudent.classPlanUrl || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, classPlanUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    O botão na lista de alunos abrirá este link em nova aba.
                  </span>
                </div>
              </div>

              {/* Status e Observações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Status da Matrícula
                  </label>
                  <select
                    value={editingStudent.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, isActive: e.target.value === 'active' })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="active">Ativo (Fazendo aulas)</option>
                    <option value="inactive">Inativo (Pausado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Observações / Metas
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Foco em pronúncia e entrevistas"
                    value={editingStudent.notes || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  <Check size={16} />
                  Salvar Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STUDY PLANNER (Fallback se aluno não tiver link externo configurado) */}
      {isStudyPlannerOpen && currentStudyPlanner && activePlannerStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Study Planner: {activePlannerStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500">Cronograma de estudos e metas pedagógicas</p>
                </div>
              </div>
              <button
                onClick={() => setIsStudyPlannerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStudyPlanner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Meta Semanal de Estudos Extras (horas/semana)
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={currentStudyPlanner.weeklyHoursTarget}
                  onChange={(e) => setCurrentStudyPlanner({ ...currentStudyPlanner, weeklyHoursTarget: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Objetivos Principais de Aprendizado
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Destravar a fala para reuniões corporativas..."
                  value={currentStudyPlanner.learningGoals}
                  onChange={(e) => setCurrentStudyPlanner({ ...currentStudyPlanner, learningGoals: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Materiais e Recursos Recomendados
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: BBC Learning English, Anki Flashcards, Podcast 6 Minute English..."
                  value={currentStudyPlanner.recommendedMaterials}
                  onChange={(e) => setCurrentStudyPlanner({ ...currentStudyPlanner, recommendedMaterials: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Rotina Sugerida para o Aluno
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: 15 min diários de vocabulário + 1 episódio de podcast..."
                  value={currentStudyPlanner.weeklyRoutine}
                  onChange={(e) => setCurrentStudyPlanner({ ...currentStudyPlanner, weeklyRoutine: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudyPlannerOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  <Save size={16} />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CLASS PLAN (Fallback se aluno não tiver link externo configurado) */}
      {isClassPlanOpen && currentClassPlan && activePlanStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Class Plan: {activePlanStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500">Plano pedagógico e conteúdo programático</p>
                </div>
              </div>
              <button
                onClick={() => setIsClassPlanOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveClassPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Unidade / Módulo Atual
                </label>
                <input
                  type="text"
                  placeholder="Ex: Unit 4 - Travel & Culture"
                  value={currentClassPlan.currentUnit}
                  onChange={(e) => setCurrentClassPlan({ ...currentClassPlan, currentUnit: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Foco Gramatical (Grammar Topics)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Present Simple vs Present Continuous"
                  value={currentClassPlan.grammarTopics}
                  onChange={(e) => setCurrentClassPlan({ ...currentClassPlan, grammarTopics: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Lição de Casa Pendente (Homework)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Exercícios da pág. 45..."
                  value={currentClassPlan.homework}
                  onChange={(e) => setCurrentClassPlan({ ...currentClassPlan, homework: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassPlanOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  <Save size={16} />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
