import { useState, useEffect } from 'react';
import { Tour } from '../../../types/expedition';
import { toursApi } from '../api/tours.api';
import { TourFilter } from '../types/tour.types';

export function useTours(filter?: TourFilter) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    toursApi.getTours().then((data) => {
      if (!isMounted) return;
      let filtered = data;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        filtered = filtered.filter(
          (t) => t.title.toLowerCase().includes(q) || t.operatorName.toLowerCase().includes(q)
        );
      }
      setTours(filtered);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [filter?.search, filter?.difficulty]);

  return { tours, isLoading };
}
