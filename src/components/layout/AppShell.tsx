import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ToastContainer } from '../ui/Toast';

export interface AppShellProps {
  children: React.ReactNode;
  hideNavbar?: boolean;
  hideFooter?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  hideNavbar = false,
  hideFooter = false,
}) => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] flex flex-col font-sans selection:bg-[#C2410C]/20 selection:text-[#C2410C]">
      {!hideNavbar && <Navbar />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
      <ToastContainer />
    </div>
  );
};
