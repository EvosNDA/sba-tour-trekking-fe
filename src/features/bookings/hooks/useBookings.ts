import { useState, useEffect } from 'react';
import { Booking } from '../../../types/expedition';
import { bookingsApi } from '../api/bookings.api';
import { INITIAL_BOOKING } from '../../../data/mockData';

export function useBookings() {
  const [booking, setBooking] = useState<Booking>(() => {
    try {
      const saved = localStorage.getItem('wetrek_booking_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return INITIAL_BOOKING;
  });

  useEffect(() => {
    bookingsApi.saveBooking(booking);
  }, [booking]);

  const updateBooking = (updated: Booking | ((prev: Booking) => Booking)) => {
    setBooking(updated);
  };

  const resetBooking = () => {
    setBooking(INITIAL_BOOKING);
    try {
      localStorage.removeItem('wetrek_booking_v1');
    } catch {
      // Ignore
    }
  };

  return {
    booking,
    updateBooking,
    resetBooking,
  };
}
