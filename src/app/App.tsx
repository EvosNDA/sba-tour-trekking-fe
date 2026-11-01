import React, { useEffect } from 'react';
import { Providers } from './providers';
import { AppRouter } from './router';
import { ToastContainer } from '../components/ui/Toast';
import { authApi } from '../features/auth/api/auth.api';

export function App() {
  // Restore session once on app mount via POST /api/v1/auth/refresh -> GET /api/v1/auth/me
  useEffect(() => {
    authApi.restoreSession();
  }, []);

  return (
    <Providers>
      <AppRouter />
      <ToastContainer />
    </Providers>
  );
}

export default App;
