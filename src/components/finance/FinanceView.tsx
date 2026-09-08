import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Plus, 
  Edit2, 
  Save, 
  X,
  Check
} from 'lucide-react';
import { Student, FinanceRecord } from '../../types';
import { db } from '../../services/db';

interface FinanceViewProps {
  students: Student[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({ students }) => {
  const [records, setRecords] = useState<FinanceRecord[]>(() => db.getFinanceRecords());
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<FinanceRecord>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecordData, setNewRecordData] = useState<Partial<FinanceRecord>>({
    month: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    hourlyRate: 120,
    classesCount: 4,
    status: 'Pendente',
    notes: 'Mensalidade'
  });

  const activeStudents = students.filter(s => s.isActive);

  // Sync records with students if any new active student was added
  React.useEffect(() => {
    db.syncFinanceWithStudents(students);
    setRecords(db.getFinanceRecords());
  }, [students]);

  // Calculations
  const totalForecast = records.reduce((acc, r) => acc + (r.totalAmount || (r.hourlyRate * r.classesCount)), 0);
  const totalReceived = records
    .filter(r => r.status === 'Pago')
    .reduce((acc, r) => acc + (r.totalAmount || (r.hourlyRate * r.classesCount)), 0);
  const totalPending = totalForecast - totalReceived;

  const paidCount = records.filter(r => r.status === 'Pago').length;

  const handleToggleStatus = (record: FinanceRecord) => {
    const newStatus = record.status === 'Pago' ? 'Pendente' : 'Pago';
    const updatedRecord: FinanceRecord = {
      ...record,
      status: newStatus,
      paymentDate: newStatus === 'Pago' ? new Date().toLocaleDateString('pt-BR') : undefined
    };
    const updated = db.saveFinanceRecord(updatedRecord);
    setRecords(updated);
  };

  const handleStartEdit = (record: FinanceRecord) => {
    setEditingRecordId(record.id);
    setEditFormData({ ...record });
  };

  const handleSaveInlineEdit = (id: string) => {
    const existing = records.find(r => r.id === id);
    if (!existing) return;

    const rate = Number(editFormData.hourlyRate) || existing.hourlyRate;
    const count = Number(editFormData.classesCount) || existing.classesCount;

    const updatedRecord: FinanceRecord = {
      ...existing,
      hourlyRate: rate,
      classesCount: count,
      totalAmount: rate * count,
      notes: editFormData.notes !== undefined ? editFormData.notes : existing.notes
    };

    const updated = db.saveFinanceRecord(updatedRecord);
    setRecords(updated);
    setEditingRecordId(null);
  };

  const handleCreateNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordData.studentId) return;

    const rate = Number(newRecordData.hourlyRate) || 120;
    const count = Number(newRecordData.classesCount) || 4;

    const recordToSave: FinanceRecord = {
      id: `fin-${Date.now()}`,
      studentId: newRecordData.studentId,
      month: newRecordData.month || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      hourlyRate: rate,
      classesCount: count,
      totalAmount: rate * count,
      status: (newRecordData.status as 'Pago' | 'Pendente') || 'Pendente',
      notes: newRecordData.notes || 'Mensalidade',
      paymentDate: newRecordData.status === 'Pago' ? new Date().toLocaleDateString('pt-BR') : undefined
    };

    const updated = db.saveFinanceRecord(recordToSave);
    setRecords(updated);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <DollarSign size={28} className="text-blue-600" />
            Controle Financeiro
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Faturamento, mensalidades de inglês e demonstrativo editável por aluno
          </p>
        </div>

        <button
          onClick={() => {
            setNewRecordData({
              studentId: students[0]?.id || '',
              month: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
              hourlyRate: 120,
              classesCount: 4,
              status: 'Pendente',
              notes: 'Mensalidade'
            });
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus size={18} />
          Adicionar Cobrança
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Receita Recebida */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg flex-shrink-0">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Receita Recebida</p>
            <p className="text-2xl font-bold text-slate-800">
              R$ {totalReceived.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              {paidCount} mensalidades pagas
            </p>
          </div>
        </div>

        {/* Previsão Total */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Previsão Total do Mês</p>
            <p className="text-2xl font-bold text-slate-800">
              R$ {totalForecast.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Baseado no valor e aulas combinadas
            </p>
          </div>
        </div>

        {/* A Receber (Pendente) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg flex-shrink-0">
            <CreditCard size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">A Receber (Pendente)</p>
            <p className="text-2xl font-bold text-amber-700">
              R$ {totalPending.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {records.length - paidCount} mensalidades aguardando
            </p>
          </div>
        </div>
      </div>

      {/* Demonstrativo Financeiro 100% Editável */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              Demonstrativo por Aluno (100% Editável)
            </h3>
            <p className="text-xs text-slate-400">
              Clique no botão de status para alternar entre "Pago" e "Pendente", ou no lápis para alterar valores.
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Nenhum registro financeiro cadastrado. Cadastre alunos para gerar a previsão.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-4">Mês de Referência</th>
                  <th className="py-3.5 px-4">Valor Hora/Aula</th>
                  <th className="py-3.5 px-4">Aulas / Mês</th>
                  <th className="py-3.5 px-4">Total Devido</th>
                  <th className="py-3.5 px-4 text-center">Status Pagamento</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {records.map((record) => {
                  const student = students.find(s => s.id === record.studentId);
                  const isEditing = editingRecordId === record.id;
                  const isPaid = record.status === 'Pago';
                  const total = record.totalAmount || (record.hourlyRate * record.classesCount);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Aluno */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {student?.name || 'Aluno Excluído'}
                      </td>

                      {/* Mês */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium capitalize">
                        {record.month}
                      </td>

                      {/* Valor Hora/Aula */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">R$</span>
                            <input
                              type="number"
                              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                              value={editFormData.hourlyRate || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, hourlyRate: Number(e.target.value) })}
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-700">
                            R$ {record.hourlyRate.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Aulas no Mês */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                              value={editFormData.classesCount || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, classesCount: Number(e.target.value) })}
                            />
                            <span className="text-xs text-slate-400">aulas</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">
                            {record.classesCount} aulas
                          </span>
                        )}
                      </td>

                      {/* Total Devido */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        R$ {total.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Status Pagamento (Click to Toggle) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(record)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 shadow-2xs ${
                            isPaid
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                          }`}
                          title="Clique para alternar entre Pago e Pendente"
                        >
                          {isPaid ? <CheckCircle size={14} /> : <Clock size={14} />}
                          <span>{record.status}</span>
                        </button>
                      </td>

                      {/* Ações (Inline Edit) */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveInlineEdit(record.id)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                              title="Salvar valores"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditingRecordId(null)}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                              title="Cancelar edição"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(record)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar valores e horas deste aluno"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Adicionar Cobrança / Mensalidade Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <DollarSign size={20} className="text-blue-600" />
                Nova Cobrança / Mensalidade
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Aluno
                </label>
                <select
                  required
                  value={newRecordData.studentId || ''}
                  onChange={(e) => {
                    const st = students.find(s => s.id === e.target.value);
                    setNewRecordData({
                      ...newRecordData,
                      studentId: e.target.value,
                      hourlyRate: st?.hourlyRate || 120
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
                    Mês de Referência
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Outubro 2026"
                    value={newRecordData.month || ''}
                    onChange={(e) => setNewRecordData({ ...newRecordData, month: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Valor por Hora (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={newRecordData.hourlyRate || 120}
                    onChange={(e) => setNewRecordData({ ...newRecordData, hourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Quantidade de Aulas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRecordData.classesCount || 4}
                    onChange={(e) => setNewRecordData({ ...newRecordData, classesCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={newRecordData.status || 'Pendente'}
                    onChange={(e) => setNewRecordData({ ...newRecordData, status: e.target.value as 'Pago' | 'Pendente' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  <Check size={16} />
                  Salvar Cobrança
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
