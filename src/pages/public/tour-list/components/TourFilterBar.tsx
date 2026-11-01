import React from 'react';

interface TourFilterBarProps {
  difficulty: string;
  onSelectDifficulty: (d: string) => void;
}

export const TourFilterBar: React.FC<TourFilterBarProps> = ({
  difficulty,
  onSelectDifficulty,
}) => {
  return (
    <div className="flex items-center gap-2">
      {[{ value: 'ALL', label: 'Tất cả' }, { value: 'Easy', label: 'Dễ' }, { value: 'Medium', label: 'Trung bình' }, { value: 'Hard', label: 'Khó' }].map((item) => (
        <button
          key={item.value}
          onClick={() => onSelectDifficulty(item.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            difficulty === item.value ? 'bg-[#C2410C] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};
