import { AlertCircle, ArrowRight, LoaderCircle } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';

export function TourState({ loading, errorCode, retry, onSignIn }: {
  loading?: boolean; errorCode?: string | null; retry?: () => void; onSignIn?: () => void;
}) {
  const { t } = useI18n();
  if (loading) return <div className="trip-state" role="status"><LoaderCircle className="trip-loading-icon" aria-hidden="true" /><p>{t('trip.loading')}</p></div>;
  const auth = errorCode === 'UNAUTHORIZED';
  const key = auth ? 'trip.signInHelp' : errorCode === 'FORBIDDEN' ? 'trip.forbidden' : errorCode === 'RESOURCE_NOT_FOUND' ? 'trip.notFound' : 'trip.error';
  return <div className="trip-state trip-state-error" role="alert"><AlertCircle aria-hidden="true" />
    {auth && <h2>{t('trip.signInTitle')}</h2>}<p>{t(key)}</p>
    {auth && onSignIn ? <button className="trip-button" onClick={onSignIn}>{t('trip.signIn')}<ArrowRight size={17} aria-hidden="true" /></button>
      : retry && <button className="trip-button trip-button-secondary" onClick={retry}>{t('trip.retry')}</button>}
  </div>;
}

export function TourPagination({ page, totalPages, onChange, schedules = false }: {
  page: number; totalPages: number; onChange: (page: number) => void; schedules?: boolean;
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;
  return <nav className="trip-pagination" aria-label={t(schedules ? 'trip.departurePages' : 'trip.pages')}>
    <button className="trip-button trip-button-secondary" disabled={page === 0} onClick={() => onChange(page - 1)}>{t('trip.previous')}</button>
    <span>{t('trip.page', { current: page + 1, total: totalPages })}</span>
    <button className="trip-button trip-button-secondary" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>{t('trip.next')}</button>
  </nav>;
}
