import { useState, useEffect, useCallback } from 'react';
import { bookingsApi } from '../api/bookings.api';
import type { BookingSummaryResponse, BookingStatus } from '../types/booking.types';
import type { ApiError } from '../../../types/api.types';

export function useBookings(params?: { status?: BookingStatus | ''; page?: number; size?: number }) {
  const [bookings, setBookings] = useState<BookingSummaryResponse[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pageData = await bookingsApi.getMyBookings(params);
      setBookings(pageData.content || []);
      setTotalElements(pageData.totalElements || 0);
      setTotalPages(pageData.totalPages || 0);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [params?.status, params?.page, params?.size]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    totalElements,
    totalPages,
    isLoading,
    error,
    refetch: fetchBookings,
  };
}
