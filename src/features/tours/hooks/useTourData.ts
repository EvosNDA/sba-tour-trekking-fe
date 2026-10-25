import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../../stores/auth.store';

export function useTourResource<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const { token, isRestoring } = useAuthStore();
  const loader = useRef(load);
  loader.current = load;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ data: T | null; loading: boolean; errorCode: string | null }>({
    data: null, loading: true, errorCode: null,
  });
  useEffect(() => {
    if (isRestoring) return;
    const controller = new AbortController();
    setState({ data: null, loading: true, errorCode: null });
    loader.current(controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ data, loading: false, errorCode: null });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'NETWORK_ERROR';
      setState({ data: null, loading: false, errorCode: code });
    });
    return () => controller.abort();
  }, [key, attempt, token, isRestoring]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
