import React, { useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuthStore } from '../../stores/auth.store';
import { useLocation } from '../../lib/navigation';

export interface PublicPortalLayoutProps {
  children: React.ReactNode;
}

export const PublicPortalLayout: React.FC<PublicPortalLayoutProps> = ({ children }) => {
  const { xRole } = useAuthStore();
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash === '#how-it-works') {
      document.getElementById('how-it-works')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }, [pathname, hash]);

  return (
    <div
      data-x-role={xRole}
      className={`public-layout ${pathname === '/' || pathname === '' ? 'public-layout-home' : ''} min-h-screen bg-[#FDFBF7] text-[#1C2526] flex flex-col font-sans selection:bg-[#C2410C]/20 selection:text-[#C2410C]`}
    >
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default PublicPortalLayout;
