import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { MobileHeader } from './components/layout/MobileHeader';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentsView } from './components/students/StudentsView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { FinanceView } from './components/finance/FinanceView';
import { SettingsView } from './components/settings/SettingsView';
import { mockStudents, getInitialLessons } from './data/mockData';
import { ViewType, TeacherSettings } from './types';
import { BrainCircuit, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [students, setStudents] = useState(mockStudents);
  const [lessons, setLessons] = useState(getInitialLessons());

  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>({
    name: 'Isabelle Carelli',
    email: 'isabelle.carelli@exemplo.com',
    enableRepertoireTracking: true,
    city: 'São Paulo',
    state: 'SP',
    whatsapp: '(11) 98888-7777'
  });

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            students={students}
            lessons={lessons}
            onNavigate={(view) => setCurrentView(view)}
          />
        );
      case 'students':
        return (
          <StudentsView
            students={students}
          />
        );
      case 'schedule':
      case 'lesson-log':
        return (
          <ScheduleView
            lessons={lessons}
            students={students}
          />
        );
      case 'finance':
      case 'expenses':
        return (
          <FinanceView
            students={students}
            lessons={lessons}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={teacherSettings}
            onUpdateSettings={setTeacherSettings}
          />
        );
      case 'ai-tools':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <BrainCircuit size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Assistente Pedagógico IA</h2>
                <p className="text-slate-500 text-sm">Geração de planos de aula e atividades adaptadas para cada perfil de aluno</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <Sparkles className="text-blue-600 flex-shrink-0" size={20} />
              <p className="text-blue-900 text-sm">
                O módulo de IA está integrado ao Google Gemini API para criar relatórios pedagógicos e exercícios personalizados para alunos com TDAH, Autismo e Altas Habilidades.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <DashboardView
            students={students}
            lessons={lessons}
            onNavigate={(view) => setCurrentView(view)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
        userName={teacherSettings.name}
        enableRepertoire={teacherSettings.enableRepertoireTracking}
        onLogout={() => alert('Sessão encerrada com sucesso.')}
      />

      {/* Main content container */}
      <main
        className={`
          flex-1 overflow-y-auto transition-all duration-300
          ${isCollapsed ? 'ml-0 md:ml-16' : 'ml-0 lg:ml-64'}
        `}
      >
        {/* Mobile Header */}
        <MobileHeader onOpenMobileMenu={() => setIsMobileOpen(true)} />

        {/* Inner Content Area */}
        <div className="max-w-7xl mx-auto p-6 md:p-8 pt-20 lg:pt-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
