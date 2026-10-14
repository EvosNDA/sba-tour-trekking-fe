import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScreenId } from '../../types/expedition';

export interface MainLayoutProps {
  children: React.ReactNode;
  currentScreen?: ScreenId;
  onNavigate?: (screen: ScreenId) => void;
  searchTerm?: string;
  onSearch?: (term: string) => void;
  showHeader?: boolean;
  showFooter?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentScreen = 'marketplace',
  onNavigate = () => {},
  searchTerm,
  onSearch,
  showHeader = true,
  showFooter = true,
}) => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans selection:bg-[#C2410C]/20 selection:text-[#C2410C]">
      {showHeader && (
        <Header
          currentScreen={currentScreen}
          onNavigate={onNavigate}
          searchTerm={searchTerm}
          onSearch={onSearch}
        />
      )}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};
