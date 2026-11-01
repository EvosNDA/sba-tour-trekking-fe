import React, { useEffect, useState } from 'react';

export interface NavTabItem {
  id: string;
  label: string;
}

interface TourNavTabsProps {
  tabs: NavTabItem[];
  activeId: string;
  onSelectTab: (id: string) => void;
}

export const TourNavTabs: React.FC<TourNavTabsProps> = ({
  tabs,
  activeId,
  onSelectTab,
}) => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if scrolled past certain threshold
      setIsSticky(window.scrollY > 380);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      aria-label="Điều hướng nhanh nội dung tour"
      className={`sticky top-0 z-30 transition-all duration-200 border-b ${
        isSticky
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-[#E6E1D8]'
          : 'bg-white border-[#E6E1D8] rounded-2xl mb-6 shadow-2xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <ul className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 text-xs sm:text-sm font-semibold text-[#64748B]">
          {tabs.map((tab) => {
            const isActive = activeId === tab.id;
            return (
              <li key={tab.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1F4E43] text-white shadow-xs'
                      : 'hover:text-[#1C2526] hover:bg-[#F7F4EE]'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
