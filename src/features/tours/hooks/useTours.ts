import { useState, useEffect, useCallback } from 'react';
import { toursApi } from '../api/tours.api';
import type { TourSummaryResponse, TourQueryParams } from '../types/tour.types';
import type { ApiError } from '../../../types/api.types';

export function useTours(params?: TourQueryParams) {
  const [tours, setTours] = useState<TourSummaryResponse[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchTours = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pageData = await toursApi.listTours(params);
      setTours(pageData.content || []);
      setTotalElements(pageData.totalElements || 0);
      setTotalPages(pageData.totalPages || 0);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [params?.page, params?.size, params?.query, params?.difficulty, params?.durationDays]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  return {
    tours,
    totalElements,
    totalPages,
    isLoading,
    error,
    refetch: fetchTours,
  };
}
