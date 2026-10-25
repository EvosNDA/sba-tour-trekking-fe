import type { RentalSelection, ScheduleSummaryResponse, TourEquipmentResponse, TravelerDraft } from './types/tour-contract.types';

export const availablePlaces = (schedule: ScheduleSummaryResponse) => Math.max(0, schedule.capacity - schedule.heldSeats - schedule.confirmedSeats);
export const isUpcoming = (schedule: ScheduleSummaryResponse) => schedule.status === 'SCHEDULED' && Date.parse(schedule.startsAt) > Date.now();

/** null means invalid/unpriced. A configured zero price remains valid. */
export function rentalCost(selection: RentalSelection, equipment: TourEquipmentResponse | null, people: number): number | null {
  if (selection.mode === 'NONE') return 0;
  if (!equipment) return null;
  let total = 0;
  if (selection.mode === 'PACKAGE') {
    const pack = equipment.equipmentPackage;
    if (!pack || pack.id !== selection.packageId || pack.rentalPriceVnd == null) return null;
    total = pack.rentalPriceVnd * people;
  } else {
    if (!selection.items.length || new Set(selection.items.map(item => item.itemId)).size !== selection.items.length) return null;
    for (const selected of selection.items) {
      const item = equipment.items.find(value => value.id === selected.itemId);
      if (!item || item.individualRentalPriceVnd == null || !Number.isSafeInteger(selected.quantity) || selected.quantity <= 0) return null;
      total += item.individualRentalPriceVnd * selected.quantity;
    }
  }
  return Number.isSafeInteger(total) && total >= 0 ? total : null;
}

export function travelerErrors(person: TravelerDraft, contact = false): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!person.fullName.trim() || person.fullName.trim().length > 200) errors.fullName = 'trip.nameRequired';
  if ((contact || person.email.trim()) && (person.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email.trim()))) errors.email = 'trip.emailInvalid';
  const phone = person.phone.trim();
  const digits = phone.replace(/\D/g, '');
  if ((contact || phone) && (!/^\+?[\d\s().-]{7,30}$/.test(phone) || digits.length < 7 || digits.length > 15)) errors.phone = 'trip.phoneInvalid';
  return errors;
}

export const cleanTraveler = (person: TravelerDraft): TravelerDraft => ({
  fullName: person.fullName.trim(), email: person.email.trim(), phone: person.phone.trim(),
});
