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
      {['ALL', 'Easy', 'Medium', 'Hard'].map((d) => (
        <button
          key={d}
          onClick={() => onSelectDifficulty(d)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            difficulty === d ? 'bg-[#C2410C] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
};
