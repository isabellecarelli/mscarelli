import React from 'react';
import { StatCards } from './StatCards';
import { TodaySchedule } from './TodaySchedule';
import { WeekView } from './WeekView';
import { Student, Lesson, ViewType } from '../../types';

interface DashboardViewProps {
  students: Student[];
  lessons: Lesson[];
  onNavigate?: (view: ViewType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  lessons,
  onNavigate
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLessons = lessons
    .filter((l) => l.date.startsWith(todayStr))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const activeStudentsCount = students.filter((s) => s.isActive).length;

  const todayLessonHours = todayLessons.reduce(
    (acc, cur) => acc + cur.durationMinutes / 60,
    0
  );

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

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

      {/* Detailed Today Schedule */}
      <TodaySchedule
        todayLessons={todayLessons}
        students={students}
        onNavigate={onNavigate}
      />

      {/* 5-Day Week Calendar View */}
      <WeekView
        students={students}
        lessons={lessons}
      />
    </div>
  );
};
