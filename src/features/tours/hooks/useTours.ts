import { useEffect, useState } from 'react';
import { toursApi } from '../api/tours.api';
import { LocationDto, TourDetailDto, TourFilter, TourPageDto, TourReviewsDto } from '../types/tour.types';

export function useTours(filter: TourFilter = {}) {
  const [data, setData] = useState<TourPageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(filter);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    toursApi.getTours(JSON.parse(key)).then(r => { if (active) setData(r); })
      .catch(() => { if (active) setError('Could not load tours. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key]);
  return { data, loading, error };
}

export function useTour(id?: string) {
  const [data, setData] = useState<TourDetailDto | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!id) { setData(null); setLoading(false); setError('Tour not found.'); return; }
    setLoading(true); setError(null);
    toursApi.getTourById(id).then(r => { if (active) setData(r); })
      .catch(() => { if (active) setError('Could not load this tour. It may be unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  return { data, loading, error };
}

export function useLocations() {
  const [data, setData] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    toursApi.getDestinations().then(r => { if (active) setData(r); })
      .catch(() => { if (active) setError('Could not load locations.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { data, loading, error };
}

export function useTourReviews(id?: number | string, page = 0, size = 10) {
  const [data, setData] = useState<TourReviewsDto | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (id == null) { setData(null); setLoading(false); return; }
    setLoading(true); setError(null);
    toursApi.getReviews(id, page, size).then(r => { if (active) setData(r); })
      .catch(() => { if (active) setError('Reviews are currently unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, page, size]);
  return { data, loading, error };
}
