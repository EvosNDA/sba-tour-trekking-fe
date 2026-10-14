import { EXPLORE_TOURS, POPULAR_DESTINATIONS, TOUR_COMPANIES } from '../../../data/mockData';
import { Tour, Destination, TourCompany } from '../../../types/expedition';

export const toursApi = {
  getTours: async (): Promise<Tour[]> => {
    return EXPLORE_TOURS;
  },

  getTourById: async (id: string): Promise<Tour | undefined> => {
    return EXPLORE_TOURS.find((t) => t.id === id);
  },

  getDestinations: async (): Promise<Destination[]> => {
    return POPULAR_DESTINATIONS;
  },

  getCompanies: async (): Promise<TourCompany[]> => {
    return TOUR_COMPANIES;
  },
};
