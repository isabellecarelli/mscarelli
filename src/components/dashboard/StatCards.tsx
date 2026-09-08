import React from 'react';
import { Users, Clock } from 'lucide-react';

interface StatCardsProps {
  totalStudents: number;
  todayLessonHours: number;
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalStudents,
  todayLessonHours
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Total Alunos */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg flex-shrink-0">
          <Users size={28} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Total Alunos</p>
          <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
        </div>
      </div>

      {/* Horas de Aula (Hoje) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg flex-shrink-0">
          <Clock size={28} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Horas de Aula (Hoje)</p>
          <p className="text-2xl font-bold text-slate-800">{todayLessonHours.toFixed(1)}h</p>
        </div>
      </div>
    </div>
  );
};
