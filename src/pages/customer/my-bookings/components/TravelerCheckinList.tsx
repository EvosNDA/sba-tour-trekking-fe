import React from 'react';
import { Traveler } from '../../../../types/expedition';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface TravelerCheckinListProps {
  travelers: Traveler[];
  onToggleCheckIn: (travelerId: string) => void;
}

export const TravelerCheckinList: React.FC<TravelerCheckinListProps> = ({
  travelers,
  onToggleCheckIn,
}) => {
  const checkedInCount = travelers.filter((t) => t.checkInStatus === 'Checked In').length;

  return (
    <div className="bg-white border border-[#E6E1D8] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
            Traveler List &amp; Gate Check-in
          </h3>
          <p className="text-xs text-[#64748B]">
            Each traveler can check in separately when arriving at Tram Ton Station.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold text-[#1F4E43] bg-[#B9EADB]/40 px-2.5 py-1 rounded border border-[#B9EADB]">
          {checkedInCount} of {travelers.length} Checked In
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E6E1D8] text-[10px] font-mono text-[#78716C] uppercase bg-[#FAF8F5]">
              <th className="py-2.5 px-3">TRAVELER</th>
              <th className="py-2.5 px-3">ID / PASSPORT</th>
              <th className="py-2.5 px-3">GEAR</th>
              <th className="py-2.5 px-3">CHECK-IN STATUS</th>
              <th className="py-2.5 px-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E1D8]">
            {travelers.map((t) => {
              const isChecked = t.checkInStatus === 'Checked In';
              return (
                <tr key={t.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#C2410C] text-white flex items-center justify-center font-bold text-[10px]">
                        {t.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-bold text-[#1C2526] block">{t.name}</span>
                        {t.role === 'TRIP LEADER' && (
                          <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                            TRIP LEADER
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-[#64748B]">
                    {t.passport}
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] block">{t.gearTag}</span>
                    <span className="text-[10px] text-[#78716C]">{t.gearChoice}</span>
                  </td>

                  <td className="py-3 px-3">
                    {isChecked ? (
                      <div className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Checked In ({t.checkInTime || '06:14 AM'})</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Waiting at Gate</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onToggleCheckIn(t.id)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#F7F4EE] hover:bg-[#EFECE4] text-[#1C2526] border border-[#E6E1D8]'
                          : 'bg-[#1F4E43] hover:bg-[#15372F] text-white'
                      }`}
                    >
                      {isChecked ? 'View Pass' : 'Check Status'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-2.5 bg-[#F7F4EE] rounded border border-[#E6E1D8] text-[11px] text-[#78716C] flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
        <span>
          Park rangers let group members enter one by one. Time will be recorded at the mountain top (2,800m point).
        </span>
      </div>
    </div>
  );
};
