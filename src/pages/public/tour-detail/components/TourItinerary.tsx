import React from 'react';

export const TourItinerary: React.FC = () => {
  const steps = [
    {
      day: 'Day 1',
      title: 'Tram Ton Pass Gate to Camp II (2,800m MSL)',
      desc: 'Meet lead guide Giang A Pao at 06:30 AM. Acclimatization hike through bamboo forest and ridge ascent.',
    },
    {
      day: 'Day 2',
      title: 'Summit Push (3,143m) & Sea of Clouds Descent',
      desc: 'Dawn alpine start at 04:30 AM. Stand atop Indochina summit at sunrise. Return traverse to basecamp.',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
      <h3 className="font-editorial text-xl font-bold text-[#1C2526]">Expedition Field Itinerary</h3>
      <div className="space-y-4">
        {steps.map((s, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="w-16 shrink-0">
              <span className="text-xs font-mono font-bold bg-[#C2410C]/10 text-[#C2410C] px-2 py-1 rounded">
                {s.day}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-800">{s.title}</h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
