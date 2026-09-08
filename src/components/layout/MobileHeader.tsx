import React from 'react';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  onOpenMobileMenu: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenMobileMenu }) => {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
      <button
        onClick={onOpenMobileMenu}
        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>
      <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
        Profeu
      </h1>
    </div>
  );
};
