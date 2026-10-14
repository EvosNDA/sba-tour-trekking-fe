import React from 'react';
import { Sidebar } from './Sidebar';
import { ScreenId } from '../../types/expedition';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  currentScreen?: ScreenId;
  onNavigate?: (screen: ScreenId) => void;
  role?: 'partner' | 'admin';
  title?: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentScreen,
  onNavigate = () => {},
  role = 'partner',
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex font-sans">
      <Sidebar currentScreen={currentScreen} onNavigate={onNavigate} role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        {(title || subtitle) && (
          <header className="bg-white border-b border-stone-200 px-8 py-5">
            {title && <h1 className="text-xl font-bold text-[#1C2526]">{title}</h1>}
            {subtitle && <p className="text-xs text-stone-500 mt-1">{subtitle}</p>}
          </header>
        )}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
