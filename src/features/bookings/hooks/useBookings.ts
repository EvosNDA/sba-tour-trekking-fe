import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { bookingErrorKey, bookingsApi } from '../api/bookings.api';
import type { BookingPage } from '../types/booking.types';

export function useBookings(page: number) {
  const { user } = useAuthStore();
  const [data, setData] = useState<BookingPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null); setData(null);
    bookingsApi.list(page, controller.signal).then(result => {
      if (!controller.signal.aborted) setData(result);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(bookingErrorKey(cause));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, revision, user?.id]);
  return { data, error, loading, refresh };
}
