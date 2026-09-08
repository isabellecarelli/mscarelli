import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookOpen, 
  Music, 
  DollarSign, 
  Receipt, 
  BrainCircuit, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut 
} from 'lucide-react';
import { ViewType } from '../../types';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  onLogout?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
  userName?: string;
  enableRepertoire?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileToggle,
  userName = "Professora Isabelle",
  enableRepertoire = true
}) => {
  const primaryNav = [
    { id: 'dashboard' as ViewType, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'students' as ViewType, label: 'Alunos', icon: Users },
    { id: 'schedule' as ViewType, label: 'Agenda', icon: Calendar },
    { id: 'lesson-log' as ViewType, label: 'Diário de Aulas', icon: BookOpen }
  ];

  const repertoireNav = { id: 'repertoire' as ViewType, label: 'Repertório', icon: Music };

  const secondaryNav = [
    { id: 'finance' as ViewType, label: 'Financeiro', icon: DollarSign },
    { id: 'expenses' as ViewType, label: 'Despesas', icon: Receipt },
    { id: 'ai-tools' as ViewType, label: 'Assistente IA', icon: BrainCircuit },
    { id: 'settings' as ViewType, label: 'Configurações', icon: Settings }
  ];

  const navItems = enableRepertoire 
    ? [...primaryNav, repertoireNav, ...secondaryNav] 
    : [...primaryNav, ...secondaryNav];

  const handleNavClick = (viewId: ViewType) => {
    setCurrentView(viewId);
    if (window.innerWidth < 1024) {
      onMobileToggle();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside element */}
      <aside
        className={`
          bg-slate-900 text-white h-screen fixed left-0 top-0 z-50
          flex flex-col shadow-lg transition-all duration-300
          ${isCollapsed ? "w-16" : "w-64"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Header / Brand */}
        <div className={`border-b border-slate-700 ${isCollapsed ? "p-3" : "p-6"}`}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Profeu
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Gestão Pedagógica
                </p>
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors hidden lg:block"
              title={isCollapsed ? "Expandir menu" : "Recolher menu"}
              aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isCollapsed ? "justify-center" : ""}
                  ${isActive 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
                `}
                title={isCollapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Teacher Profile */}
        <div className={`border-t border-slate-700 ${isCollapsed ? "p-2" : "p-4"}`}>
          {isCollapsed ? (
            <div className="flex justify-center mb-3">
              <div 
                className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold"
                title={userName}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{userName}</p>
                <p className="text-xs text-slate-400">Professor</p>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-2 px-4 py-2 rounded-lg
              text-slate-300 hover:bg-red-600 hover:text-white
              transition-colors
              ${isCollapsed ? "justify-center px-2" : ""}
            `}
            title={isCollapsed ? "Sair" : undefined}
            aria-label="Sair"
          >
            <LogOut size={18} />
            {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
