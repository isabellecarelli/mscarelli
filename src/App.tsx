import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { MobileHeader } from './components/layout/MobileHeader';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentsView } from './components/students/StudentsView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { LessonLogView } from './components/lessons/LessonLogView';
import { FinanceView } from './components/finance/FinanceView';
import { SettingsView } from './components/settings/SettingsView';
import { ViewType, Student, Lesson, TeacherSettings } from './types';
import { db } from './services/db';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persistent State from Database Service
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>(db.getSettings());

  const refreshAllData = () => {
    setStudents(db.getStudents());
    setLessons(db.getLessons());
    setTeacherSettings(db.getSettings());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // --- CRUD HANDLERS WITH DB PERSISTENCE ---
  const handleSaveStudent = (student: Student) => {
    const updated = db.saveStudent(student);
    setStudents(updated);
    setLessons(db.getLessons()); // Recarrega aulas caso tenha gerado recorrências
  };

  const handleDeleteStudent = (id: string) => {
    const updatedStudents = db.deleteStudent(id);
    setStudents(updatedStudents);
    setLessons(db.getLessons());
  };

  const handleSaveLesson = (lesson: Lesson) => {
    const updated = db.saveLesson(lesson);
    setLessons(updated);
  };

  const handleDeleteLesson = (id: string) => {
    const updated = db.deleteLesson(id);
    setLessons(updated);
  };

  const handleUpdateSettings = (settings: TeacherSettings) => {
    const updated = db.saveSettings(settings);
    setTeacherSettings(updated);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            students={students}
            lessons={lessons}
            onNavigate={(view) => setCurrentView(view)}
            onSaveLesson={handleSaveLesson}
            onDeleteLesson={handleDeleteLesson}
          />
        );
      case 'students':
        return (
          <StudentsView
            students={students}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        );
      case 'schedule':
        return (
          <ScheduleView
            lessons={lessons}
            students={students}
            onSaveLesson={handleSaveLesson}
            onDeleteLesson={handleDeleteLesson}
            onRefreshLessons={() => setLessons(db.getLessons())}
          />
        );
      case 'lesson-log':
        return (
          <LessonLogView
            students={students}
            lessons={lessons}
            onSaveLesson={handleSaveLesson}
          />
        );
      case 'finance':
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
            onUpdateSettings={handleUpdateSettings}
          />
        );
      default:
        return (
          <DashboardView
            students={students}
            lessons={lessons}
            onNavigate={(view) => setCurrentView(view)}
            onSaveLesson={handleSaveLesson}
            onDeleteLesson={handleDeleteLesson}
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
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pt-20 lg:pt-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
