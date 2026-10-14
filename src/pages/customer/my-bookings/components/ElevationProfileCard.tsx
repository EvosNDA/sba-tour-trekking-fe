import React from 'react';

export const ElevationProfileCard: React.FC = () => {
  return (
    <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
            Trail Height &amp; Camp Stops
          </h3>
          <p className="text-xs text-[#64748B]">
            Walk Up: 1,900m Tram Ton Gate to 3,143m Fansipan Peak
          </p>
        </div>
        <span className="text-xs font-mono font-semibold text-[#1F4E43] bg-[#B9EADB]/30 border border-[#B9EADB] px-2.5 py-1 rounded">
          Climb Height: +1,480m
        </span>
      </div>

      <div className="relative pt-4 pb-2">
        <svg viewBox="0 0 600 160" className="w-full h-40 overflow-visible">
          <defs>
            <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F4E43" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1F4E43" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <line x1="40" y1="30" x2="560" y2="30" stroke="#E6E1D8" strokeDasharray="3 3" />
          <line x1="40" y1="75" x2="560" y2="75" stroke="#E6E1D8" strokeDasharray="3 3" />
          <line x1="40" y1="120" x2="560" y2="120" stroke="#E6E1D8" strokeDasharray="3 3" />

          <polygon
            points="50,135 180,105 350,80 520,30 520,150 50,150"
            fill="url(#elevationGrad)"
          />

          <polyline
            points="50,135 180,105 350,80 520,30"
            fill="none"
            stroke="#1F4E43"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Waypoint 1: Tram Ton (1,900m) */}
          <circle cx="50" cy="135" r="5" fill="#C2410C" />
          <text x="50" y="155" textAnchor="middle" fontSize="10" fill="#78716C" fontFamily="sans-serif">
            Tram Ton (1,900m)
          </text>

          {/* Waypoint 2: Camp I (2,200m) */}
          <circle cx="180" cy="105" r="4" fill="#1F4E43" />
          <text x="180" y="125" textAnchor="middle" fontSize="10" fill="#78716C" fontFamily="sans-serif">
            Camp I (2,200m)
          </text>

          {/* Waypoint 3: Camp II Bivouac (2,800m) */}
          <circle cx="350" cy="80" r="4" fill="#1F4E43" />
          <text x="350" y="100" textAnchor="middle" fontSize="10" fill="#78716C" fontFamily="sans-serif">
            Camp II Bivouac (2,800m)
          </text>

          {/* Waypoint 4: Fansipan Peak (3,143m) */}
          <circle cx="520" cy="30" r="6" fill="#C2410C" stroke="#FFFFFF" strokeWidth="2" />
          <text x="520" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#C2410C" fontFamily="sans-serif">
            Fansipan Peak (3,143m)
          </text>
        </svg>
      </div>
    </div>
  );
};
