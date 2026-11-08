import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuthStore } from '../../stores/auth.store';

export interface PublicPortalLayoutProps {
  children: React.ReactNode;
}

export const PublicPortalLayout: React.FC<PublicPortalLayoutProps> = ({ children }) => {
  const { xRole } = useAuthStore();

  return (
    <div
      data-x-role={xRole}
      className="min-h-screen bg-[#FDFBF7] text-[#1C2526] flex flex-col font-sans selection:bg-[#C2410C]/20 selection:text-[#C2410C]"
    >
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default PublicPortalLayout;
