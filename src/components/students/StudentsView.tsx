import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Clock, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Target, 
  GraduationCap, 
  BookOpen, 
  Sparkles,
  Save
} from 'lucide-react';
import { Student, EnglishLevel, StudyPlanner, ClassPlan } from '../../types';
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

  const [isStudyPlannerOpen, setIsStudyPlannerOpen] = useState(false);
  const [currentStudyPlanner, setCurrentStudyPlanner] = useState<StudyPlanner | null>(null);
  const [activePlannerStudent, setActivePlannerStudent] = useState<Student | null>(null);

  const [isClassPlanOpen, setIsClassPlanOpen] = useState(false);
  const [currentClassPlan, setCurrentClassPlan] = useState<ClassPlan | null>(null);
  const [activePlanStudent, setActivePlanStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm)) ||
      s.level.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterActive === 'active') return matchesSearch && s.isActive;
    if (filterActive === 'inactive') return matchesSearch && !s.isActive;
    return matchesSearch;
  });

  // --- STUDENT MODAL HANDLERS ---
  const handleOpenNewStudent = () => {
    setEditingStudent({
      id: `student-${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      address: '',
      level: 'Básico (A2)',
      defaultSchedule: 'Terças e Quintas às 14:00',
      hourlyRate: 120,
      isActive: true,
      notes: '',
      createdAt: new Date().toISOString()
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent({ ...student });
    setIsStudentModalOpen(true);
  };

  const handleSaveStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.name) return;

    const studentToSave: Student = {
      id: editingStudent.id || `student-${Date.now()}`,
      name: editingStudent.name,
      email: editingStudent.email || '',
      phone: editingStudent.phone || '',
      address: editingStudent.address || '',
      level: editingStudent.level || 'Básico (A2)',
      defaultSchedule: editingStudent.defaultSchedule || 'A combinar',
      hourlyRate: Number(editingStudent.hourlyRate) || 120,
      isActive: editingStudent.isActive !== false,
      notes: editingStudent.notes || '',
      createdAt: editingStudent.createdAt || new Date().toISOString()
    };

    onSaveStudent(studentToSave);
    setIsStudentModalOpen(false);
    setEditingStudent(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente remover o aluno "${name}" do sistema? Todas as aulas e registros vinculados serão excluídos.`)) {
      onDeleteStudent(id);
    }
  };

  // --- STUDY PLANNER HANDLERS ---
  const handleOpenStudyPlanner = (student: Student) => {
    setActivePlannerStudent(student);
    const planner = db.getStudyPlanner(student.id);
    setCurrentStudyPlanner(planner);
    setIsStudyPlannerOpen(true);
  };

  const handleSaveStudyPlanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudyPlanner) return;
    db.saveStudyPlanner(currentStudyPlanner);
    setIsStudyPlannerOpen(false);
    alert('Study Planner atualizado com sucesso!');
  };

  // --- CLASS PLAN HANDLERS ---
  const handleOpenClassPlan = (student: Student) => {
    setActivePlanStudent(student);
    const plan = db.getClassPlan(student.id);
    setCurrentClassPlan(plan);
    setIsClassPlanOpen(true);
  };

  const handleSaveClassPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClassPlan) return;
    db.saveClassPlan(currentClassPlan);
    setIsClassPlanOpen(false);
    alert('Class Plan atualizado com sucesso!');
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
            Gestão de alunos, horários padrões, Study Planner e Class Plan
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
            placeholder="Buscar por nome, e-mail, nível..."
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

      {/* TABLE: Lista de Alunos com colunas especificadas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Nenhum aluno cadastrado</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
              Comece cadastrando seu primeiro aluno de inglês para liberar o diário de aulas, agenda e planos de aula.
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

                    {/* Horários Padrões de Aula */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                        <Clock size={14} className="text-slate-400 flex-shrink-0" />
                        <span>{student.defaultSchedule || 'A definir'}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        R$ {student.hourlyRate?.toFixed(2) || '120,00'}/hora
                      </span>
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

                    {/* Coluna Study Planner */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenStudyPlanner(student)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        title="Abrir Cronograma de Estudos do Aluno"
                      >
                        <Target size={14} />
                        Study Planner
                      </button>
                    </td>

                    {/* Coluna Class Plan */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenClassPlan(student)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        title="Abrir Plano de Aula do Aluno"
                      >
                        <GraduationCap size={14} />
                        Class Plan
                      </button>
                    </td>

                    {/* Coluna Ações (Editar e Excluir) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar dados do aluno"
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

      {/* MODAL 1: CADASTRAR / EDITAR ALUNO */}
      {isStudentModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                {students.some(s => s.id === editingStudent.id) ? 'Editar Informações do Aluno' : 'Novo Aluno de Inglês'}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Nome Completo *
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="aluno@email.com"
                    value={editingStudent.email || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
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

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Valor Hora/Aula (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={editingStudent.hourlyRate || 120}
                    onChange={(e) => setEditingStudent({ ...editingStudent, hourlyRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Horários Padrões de Aula
                </label>
                <input
                  type="text"
                  placeholder="Ex: Segundas e Quartas às 10:00"
                  value={editingStudent.defaultSchedule || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, defaultSchedule: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Endereço / Local (se presencial)
                  </label>
                  <input
                    type="text"
                    placeholder="Bairro / Rua ou Online"
                    value={editingStudent.address || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
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
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Notas / Histórico do Aluno
                </label>
                <textarea
                  rows={2}
                  placeholder="Objetivos específicos, dificuldades com pronúncia, etc..."
                  value={editingStudent.notes || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
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

      {/* MODAL 2: STUDY PLANNER */}
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
                  placeholder="Ex: Destravar a fala para entrevistas de emprego em empresas internacionais..."
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
                  placeholder="Ex: BBC Learning English, Série Ted Talks com legenda em inglês, Anki Flashcards..."
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
                  placeholder="Ex: Segundas e Quartas: 20 min de vocabulário. Sábados: assistir a 1 episódio de podcast."
                  value={currentStudyPlanner.weeklyRoutine}
                  onChange={(e) => setCurrentStudyPlanner({ ...currentStudyPlanner, weeklyRoutine: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Dicas e Orientações da Professora
                </label>
                <textarea
                  rows={2}
                  placeholder="Dicas personalizadas..."
                  value={currentStudyPlanner.notes}
                  onChange={(e) => setCurrentStudyPlanner({ ...currentStudyPlanner, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudyPlannerOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  <Save size={16} />
                  Salvar Study Planner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CLASS PLAN */}
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
                  placeholder="Ex: Future with 'will' vs 'going to'; Conditional sentences"
                  value={currentClassPlan.grammarTopics}
                  onChange={(e) => setCurrentClassPlan({ ...currentClassPlan, grammarTopics: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Foco em Vocabulário & Expressões
                </label>
                <input
                  type="text"
                  placeholder="Ex: Airport vocabulary, idioms for traveling, hotel booking dialogues"
                  value={currentClassPlan.vocabularyTopics}
                  onChange={(e) => setCurrentClassPlan({ ...currentClassPlan, vocabularyTopics: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Lição de Casa Pendente (Homework)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Exercícios 1 a 3 da pág. 45 e redigir e-mail formal..."
                  value={currentClassPlan.homework}
                  onChange={(e) => setCurrentClassPlan({ ...currentClassPlan, homework: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Objetivos da Próxima Aula
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Simular uma reunião de negócios e praticar speaking com fluência..."
                  value={currentClassPlan.nextClassObjectives}
                  onChange={(e) => setCurrentClassPlan({ ...currentClassPlan, nextClassObjectives: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassPlanOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  <Save size={16} />
                  Salvar Class Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
