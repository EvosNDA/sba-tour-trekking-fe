import React, { useState, useEffect, useCallback } from 'react';

export interface RouteLocation {
  pathname: string;
  search: string;
  hash: string;
}

function getCurrentLocation(): RouteLocation {
  return {
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
    hash: window.location.hash || '',
  };
}

export function navigateTo(to: string, options?: { replace?: boolean }) {
  if (typeof window === 'undefined') return;
  if (options?.replace) {
    window.history.replaceState({}, '', to);
  } else {
    window.history.pushState({}, '', to);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
  if (!to.includes('#')) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export function useLocation(): RouteLocation {
  const [loc, setLoc] = useState<RouteLocation>(getCurrentLocation);

  useEffect(() => {
    const handlePop = () => {
      setLoc(getCurrentLocation());
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  return loc;
}

export function useNavigate() {
  return useCallback((to: string, options?: { replace?: boolean }) => {
    navigateTo(to, options);
  }, []);
}

export function useSearchParams(): [URLSearchParams, (next: Record<string, string | number | undefined | null>, replace?: boolean) => void] {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);

  const setParams = useCallback(
    (next: Record<string, string | number | undefined | null>, replace: boolean = true) => {
      const updated = new URLSearchParams(window.location.search);
      Object.entries(next).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') {
          updated.delete(k);
        } else {
          updated.set(k, String(v));
        }
      });
      const qs = updated.toString();
      const target = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
      navigateTo(target, { replace });
    },
    []
  );

  return [params, setParams];
}
