import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  Check
} from 'lucide-react';
import { Student, Lesson, LessonStatus } from '../../types';
import { db } from '../../services/db';

interface FinanceViewProps {
  students: Student[];
  lessons: Lesson[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({ students, lessons }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [payments, setPayments] = useState<Record<string, { status: 'Pago' | 'Pendente'; paymentDate?: string }>>(() => db.getPayments());

  const navigateMonth = (direction: number) => {
    const next = new Date(selectedDate);
    next.setMonth(next.getMonth() + direction);
    setSelectedDate(next);
  };

  const monthName = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

  // Filter lessons for the selected month
  const monthLessons = lessons.filter(l => {
    const d = new Date(l.date);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  });

  // Calculate finance rows dynamically based on Agenda lessons and Student billing models
  const financeRows = students.map(student => {
    const studentMonthLessons = monthLessons.filter(l => l.studentId === student.id);
    
    // Aulas válidas (realizadas ou agendadas ou canceladas com cobrança)
    const billableLessons = studentMonthLessons.filter(l => l.status !== LessonStatus.CANCELLED_FREE);
    const completedLessons = studentMonthLessons.filter(l => l.status === LessonStatus.COMPLETED);
    const scheduledLessons = studentMonthLessons.filter(l => l.status === LessonStatus.SCHEDULED);

    const classesCount = billableLessons.length;

    let totalAmount = 0;
    let dueDateText = '';

    if (student.billingModel === 'MENSALIDADE_FIXA') {
      // Mensalidade Fixa: vencimento sempre dia 10
      totalAmount = student.billingAmount;
      dueDateText = 'Todo dia 10';
    } else {
      // Por hora: soma das aulas válidas no mês * valor por hora
      totalAmount = classesCount * student.billingAmount;
      dueDateText = 'Pós-aula (avulso)';
    }

    const paymentKey = `${student.id}-${selectedYear}-${selectedMonth}`;
    const paymentInfo = payments[paymentKey] || { status: 'Pendente' };

    return {
      student,
      classesCount,
      completedCount: completedLessons.length,
      scheduledCount: scheduledLessons.length,
      billingModel: student.billingModel,
      billingAmount: student.billingAmount,
      totalAmount,
      dueDateText,
      status: paymentInfo.status,
      paymentDate: paymentInfo.paymentDate,
      paymentKey
    };
  });

  // KPIs
  const totalForecast = financeRows.reduce((acc, row) => acc + row.totalAmount, 0);
  const totalReceived = financeRows
    .filter(row => row.status === 'Pago')
    .reduce((acc, row) => acc + row.totalAmount, 0);
  const totalPending = totalForecast - totalReceived;
  const paidCount = financeRows.filter(row => row.status === 'Pago').length;
  const totalMonthLessonsCount = monthLessons.filter(l => l.status !== LessonStatus.CANCELLED_FREE).length;

  const handleTogglePaymentStatus = (paymentKey: string, currentStatus: 'Pago' | 'Pendente') => {
    const newStatus = currentStatus === 'Pago' ? 'Pendente' : 'Pago';
    db.savePaymentStatus(paymentKey, newStatus);
    setPayments(db.getPayments());
  };

  return (
    <div className="space-y-6">
      {/* Header with Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <DollarSign size={28} className="text-emerald-600" />
            Controle Financeiro
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Cálculo dinâmico baseado nas aulas da Agenda e modelos de cobrança dos alunos
          </p>
        </div>

        {/* Month Picker */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-slate-800 capitalize min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
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
              {paidCount} de {financeRows.length} pagamentos realizados
            </p>
          </div>
        </div>

        {/* Previsão Total */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Faturamento Previsto no Mês</p>
            <p className="text-2xl font-bold text-slate-800">
              R$ {totalForecast.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalMonthLessonsCount} aulas no total em {monthName}
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
              {financeRows.length - paidCount} pendências aguardando
            </p>
          </div>
        </div>
      </div>

      {/* Tabela do Demonstrativo Financeiro */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              Demonstrativo por Aluno em {monthName}
            </h3>
            <p className="text-xs text-slate-400">
              Calculado automaticamente a partir das aulas agendadas/realizadas na Agenda. Clique no status para alternar entre "Pago" e "Pendente".
            </p>
          </div>
        </div>

        {financeRows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Nenhum aluno cadastrado para exibir o financeiro. Cadastre alunos na aba "Alunos".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-4">Modelo de Cobrança</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Aulas no Mês</th>
                  <th className="py-3.5 px-4">Valor Base</th>
                  <th className="py-3.5 px-4 font-bold text-slate-700">Total a Pagar</th>
                  <th className="py-3.5 px-4 text-center">Status Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {financeRows.map((row) => {
                  const isFixed = row.billingModel === 'MENSALIDADE_FIXA';
                  const isPaid = row.status === 'Pago';

                  return (
                    <tr key={row.student.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Aluno */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{row.student.name}</div>
                        <span className="text-[11px] text-slate-400">{row.student.level}</span>
                      </td>

                      {/* Modelo */}
                      <td className="py-3.5 px-4">
                        {isFixed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Mensalidade Fixa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Por hora
                          </span>
                        )}
                      </td>

                      {/* Vencimento */}
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {row.dueDateText}
                      </td>

                      {/* Aulas no Mês */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{row.classesCount} aulas</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {row.completedCount} realizadas • {row.scheduledCount} agendadas
                        </span>
                      </td>

                      {/* Valor Base */}
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {isFixed ? (
                          <span>R$ {row.billingAmount.toFixed(2)}/mês</span>
                        ) : (
                          <span>R$ {row.billingAmount.toFixed(2)}/hora</span>
                        )}
                      </td>

                      {/* Total Devido */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-base">
                        R$ {row.totalAmount.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Status Pagamento (Clicável com Toggle) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleTogglePaymentStatus(row.paymentKey, row.status as 'Pago' | 'Pendente')}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-105 shadow-2xs ${
                            isPaid
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                          }`}
                          title="Clique para alternar entre Pago e Pendente"
                        >
                          {isPaid ? <CheckCircle size={14} /> : <Clock size={14} />}
                          <span>{row.status}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
