import React from 'react';
import { I18nProvider } from '../i18n/I18nProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <React.StrictMode>
      <I18nProvider>{children}</I18nProvider>
    </React.StrictMode>
  );
};
