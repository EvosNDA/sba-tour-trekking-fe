import React from 'react';
import { Mountain, ShieldCheck, Compass } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-[#1C2526] text-white py-16 px-6 text-center">
      <div className="max-w-4xl mx-auto space-y-4">
        <span className="text-xs uppercase font-mono tracking-widest text-[#C2410C] bg-[#C2410C]/10 px-3 py-1 rounded-full border border-[#C2410C]/20">
          Hoang Lien Son & Northern Highlands
        </span>
        <h1 className="font-editorial text-4xl md:text-5xl font-bold tracking-tight">
          Expedition Routes & Verified Local Guides
        </h1>
        <p className="text-sm md:text-base text-stone-300 max-w-2xl mx-auto">
          Book high-mountain treks with 100% weather safety escrow, digital park passes, and certified mountain crews.
        </p>
      </div>
    </section>
  );
};
