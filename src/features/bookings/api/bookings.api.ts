import { INITIAL_BOOKING } from '../../../data/mockData';
import { Booking } from '../../../types/expedition';

export const bookingsApi = {
  getCurrentBooking: async (): Promise<Booking> => {
    try {
      const saved = localStorage.getItem('wetrek_booking_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return INITIAL_BOOKING;
  },

  saveBooking: async (booking: Booking): Promise<Booking> => {
    try {
      localStorage.setItem('wetrek_booking_v1', JSON.stringify(booking));
    } catch {
      // Ignore
    }
    return booking;
  },
};
