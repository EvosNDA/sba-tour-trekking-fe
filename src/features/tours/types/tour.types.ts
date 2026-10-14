export type { Tour, Destination, TourCompany, DiscountVoucher } from '../../../types/expedition';

export interface TourFilter {
  search?: string;
  difficulty?: string;
  destinationId?: string;
  maxPriceUSD?: number;
}
