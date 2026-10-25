import { useEffect, useState } from 'react';
import type { ScreenId } from '../../../types/expedition';
import TourListPage from '../tour-list/TourListPage';
import TourDetailPage from '../tour-detail/TourDetailPage';
import type { TourSelectionDraft } from '../../../features/tours/types/tour-contract.types';

export interface HomePageProps {
  onNavigate?: (screen: ScreenId) => void;
  searchTerm?: string;
  onSearch?: (term: string) => void;
  onSelectionReady?: (draft: TourSelectionDraft) => void;
}

export function HomePage({ onNavigate, searchTerm = '', onSearch, onSelectionReady }: HomePageProps) {
  const [tourId, setTourId] = useState<string | null>(null);
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  const changeTour = (id: string | null) => { setTourId(id); window.scrollTo({ top: 0 }); };
  return <>
    <div hidden={tourId !== null}><TourListPage onViewTour={changeTour} searchTerm={searchTerm} onSearch={onSearch} onSignIn={() => onNavigate?.('login')} /></div>
    {tourId !== null && <TourDetailPage key={tourId} tourId={tourId} onBack={() => changeTour(null)} onNavigate={onNavigate} onSelectionReady={onSelectionReady} />}
  </>;
}
export default HomePage;
