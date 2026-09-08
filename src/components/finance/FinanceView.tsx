import React from 'react';
import { DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import { Student, Lesson } from '../../types';

interface FinanceViewProps {
  students: Student[];
  lessons: Lesson[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({ students, lessons }) => {
  const activeCount = students.filter(s => s.isActive).length;
  const estimatedRevenue = students.reduce((acc, curr) => acc + (curr.hourlyRate || 120) * 4, 0);
  const completedLessons = lessons.filter(l => l.status === "Realizada");
  const realizedRevenue = completedLessons.reduce((acc, curr) => {
    const st = students.find(s => s.id === curr.studentId);
    return acc + (st?.hourlyRate || 120) * (curr.durationMinutes / 60);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
          Financeiro
        </h2>
        <p className="text-slate-500 mt-0.5">
          Acompanhamento de faturamento, recebimentos e previsões
        </p>
      </div>

      {/* Finance KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Receita Realizada</p>
            <p className="text-2xl font-bold text-slate-800">
              R$ {realizedRevenue.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Aulas concluídas no mês</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Previsão Mensal</p>
            <p className="text-2xl font-bold text-slate-800">
              R$ {estimatedRevenue.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Baseado nos alunos ativos</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <CreditCard size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Alunos em Faturamento</p>
            <p className="text-2xl font-bold text-slate-800">{activeCount} alunos</p>
            <p className="text-xs text-slate-400 mt-0.5">Cobranças automáticas ativas</p>
          </div>
        </div>
      </div>

      {/* Overview Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-blue-500" />
          Demonstrativo por Aluno
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                <th className="pb-3">Aluno</th>
                <th className="pb-3">Valor por Hora</th>
                <th className="pb-3">Horas Previstas/Mês</th>
                <th className="pb-3">Total Estimado</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="py-3 font-medium text-slate-800">{student.name}</td>
                  <td className="py-3">R$ {student.hourlyRate?.toFixed(2) || '120,00'}</td>
                  <td className="py-3">4 horas</td>
                  <td className="py-3 font-bold text-slate-700">
                    R$ {((student.hourlyRate || 120) * 4).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {student.isActive ? 'Em dia' : 'Pausado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
