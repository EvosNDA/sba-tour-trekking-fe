import { Check, Pencil } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import type {
  ActivityResponse,
  EquipmentCatalogResponse,
  RentalPackageTemplateResponse,
  RequiredItemResponse,
  ScheduleSummaryResponse,
  TourDetailResponse,
  TourMediaResponse,
} from '../types/tour-contract.types';

export type TourSetupTab = 'details' | 'activities' | 'photos' | 'equipment' | 'schedule';

interface Props {
  tour: TourDetailResponse;
  schedules: ScheduleSummaryResponse[];
  activities: ActivityResponse[];
  requiredItems: RequiredItemResponse[];
  media: TourMediaResponse[];
  rentalPackage: RentalPackageTemplateResponse | null;
  individualItems: EquipmentCatalogResponse[];
  loading: boolean;
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  onEdit: (tab: TourSetupTab) => void;
}

const sectionClass = 'border-t border-[#E6E1D8] py-5 first:border-t-0 first:pt-0 last:pb-0';
const editClass = 'inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#CAD4CF] bg-white px-3 text-sm font-semibold text-[#34413D] hover:bg-[#F5F7F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4E43]';

export default function AdminTourReviewPanel({
  tour, schedules, activities, requiredItems, media, rentalPackage, individualItems,
  loading, formatDate, formatMoney, onEdit,
}: Props) {
  const { t } = useI18n();

  if (loading) return <div role="status" className="space-y-3 p-5" aria-label={t('adminTour.review.loading')}>
    <div className="h-5 w-48 animate-pulse rounded bg-[#E8ECE9]" />
    <div className="h-20 animate-pulse rounded-lg bg-[#F3F5F3]" />
    <div className="h-20 animate-pulse rounded-lg bg-[#F3F5F3]" />
  </div>;

  const editButton = (tab: TourSetupTab) => <button type="button" className={editClass} onClick={() => onEdit(tab)}>
    <Pencil aria-hidden="true" className="h-4 w-4" />{t('adminTour.review.edit')}
  </button>;

  return <div className="space-y-5 p-5">
    <header>
      <h4 className="text-lg font-semibold text-[#1C2526]">{t('adminTour.review.title')}</h4>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-[#52605D]">{t('adminTour.review.help')}</p>
    </header>

    <div className="rounded-xl border border-[#E6E1D8] bg-white p-5">
      <section className={sectionClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h5 className="font-semibold text-[#1C2526]">{t('adminTour.details')}</h5>
            <p className="mt-1 text-sm text-[#52605D]">{tour.title}</p>
            <p className="mt-1 text-sm text-[#697671]">{[tour.difficulty, tour.durationDays ? t('adminTour.review.days', { count: tour.durationDays }) : null].filter(Boolean).join(' · ') || t('adminTour.review.missingDetails')}</p>
            {tour.description && <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#52605D]">{tour.description}</p>}
          </div>
          {editButton('details')}
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h5 className="font-semibold text-[#1C2526]">{t('adminTour.schedule')}</h5>
            {schedules.length === 0 ? <p className="mt-1 text-sm text-[#697671]">{t('adminTour.noSchedules')}</p> : <ul className="mt-2 space-y-2">
              {schedules.map(schedule => <li key={schedule.id} className="text-sm text-[#52605D]">
                <span className="font-medium text-[#1C2526]">{formatDate(schedule.startsAt)} – {formatDate(schedule.endsAt)}</span>
                <span> · {t('adminTour.capacity')}: {schedule.capacity}</span>
                <span> · {formatMoney(schedule.basePriceVnd)} VND</span>
              </li>)}
            </ul>}
          </div>
          {editButton('schedule')}
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h5 className="font-semibold text-[#1C2526]">{t('adminTour.activities')}</h5>
            {activities.length === 0 ? <p className="mt-1 text-sm text-[#697671]">{t('adminTour.noActivities')}</p> : <ul className="mt-2 space-y-1">
              {activities.map(activity => <li key={activity.id} className="text-sm text-[#52605D]">
                <span className="font-medium text-[#1C2526]">{t('trip.day', { day: activity.dayNumber })}{activity.startTime ? ` · ${activity.startTime.slice(0, 5)}` : ''}: {activity.title}</span>
                {activity.description && <span> — {activity.description}</span>}
              </li>)}
            </ul>}
          </div>
          {editButton('activities')}
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h5 className="font-semibold text-[#1C2526]">{t('adminTour.photos')}</h5>
            {media.length === 0 ? <p className="mt-1 text-sm text-[#697671]">{t('adminTour.noImages')}</p> : <ul className="mt-2 space-y-1">
              {media.map((image, index) => <li key={image.id} className="text-sm text-[#52605D]">
                {image.isCover && <span className="mr-2 inline-flex items-center gap-1 font-semibold text-[#1F4E43]"><Check aria-hidden="true" className="h-3.5 w-3.5" />{t('adminTour.cover')}</span>}
                {image.caption || t('trip.photo', { number: index + 1 })}
              </li>)}
            </ul>}
          </div>
          {editButton('photos')}
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-[#1C2526]">{t('adminTour.requiredItems')}</h5>
              {requiredItems.length === 0 ? <p className="mt-1 text-sm text-[#697671]">{t('adminTour.noRequiredItems')}</p> : <p className="mt-1 text-sm leading-6 text-[#52605D]">{requiredItems.map(item => item.name).join(' · ')}</p>}
            </div>
            <div>
              <h5 className="font-semibold text-[#1C2526]">{t('adminEquipment.rentalOptions')}</h5>
              {rentalPackage ? <div className="mt-1 text-sm text-[#52605D]">
                <p><span className="font-medium text-[#1C2526]">{rentalPackage.title}</span> · {formatMoney(rentalPackage.rentalPriceVnd)} VND / {t('adminEquipment.perPackage')}</p>
                <p className="mt-1">{rentalPackage.items.map(item => `${item.name} × ${item.quantityInPackage}`).join(' · ')}</p>
              </div> : <p className="mt-1 text-sm text-[#697671]">{t('adminEquipment.noPackageSelected')}</p>}
              {individualItems.length > 0 && <p className="mt-1 text-sm text-[#52605D]">{t('adminEquipment.individualItems')}: {individualItems.map(item => `${item.name} (${item.individualRentalPriceVnd == null ? '—' : `${formatMoney(item.individualRentalPriceVnd)} VND / ${t('adminEquipment.perItem')}`})`).join(' · ')}</p>}
            </div>
          </div>
          {editButton('equipment')}
        </div>
      </section>
    </div>

    {tour.status !== 'PUBLISHED' && <p className="rounded-lg border border-[#E6E1D8] bg-[#F7F8F6] p-3 text-sm leading-6 text-[#52605D]">{t('adminTour.publishNote')}</p>}
  </div>;
}
