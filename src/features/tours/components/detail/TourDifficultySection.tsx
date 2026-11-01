import React from 'react';
import { Mountain, Activity, CheckCircle, ShieldAlert } from 'lucide-react';
import type { DifficultyLevel } from '../../types/tour.types';

interface TourDifficultySectionProps {
  difficulty: DifficultyLevel;
  requiredExperience?: string | null;
}

const DIFFICULTY_LEVELS: Array<{
  level: DifficultyLevel;
  label: string;
  sublabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
}> = [
  {
    level: 'EASY',
    label: 'Dễ',
    sublabel: 'Cấp 1/4',
    description: 'Địa hình thoải, dốc nhẹ, đường mòn rõ nét. Phù hợp cho người mới bắt đầu trekking hoặc gia đình.',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-800',
  },
  {
    level: 'MODERATE',
    label: 'Trung bình',
    sublabel: 'Cấp 2/4',
    description: 'Địa hình đồi dốc vừa phải, băng suối cạn, có đoạn dốc liên tục. Yêu cầu thể lực cơ bản và rèn luyện thể thao.',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-800',
  },
  {
    level: 'HARD',
    label: 'Khó',
    sublabel: 'Cấp 3/4',
    description: 'Địa hình hiểm trở, dốc cao gắt, nhiều đoạn vách đá hoặc băng rừng sâu. Đòi hỏi kinh nghiệm trekking thực chiến.',
    badgeBg: 'bg-orange-50 border-orange-200',
    badgeText: 'text-orange-800',
  },
  {
    level: 'EXPERT',
    label: 'Chuyên gia',
    sublabel: 'Cấp 4/4',
    description: 'Cực kỳ khắc nghiệt, độ dốc lớn, thời tiết biến đổi nhanh và yêu cầu kỹ năng sinh tồn, thiết bị chuyên dụng.',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-800',
  },
];

export const TourDifficultySection: React.FC<TourDifficultySectionProps> = ({
  difficulty,
  requiredExperience,
}) => {
  const currentIdx = DIFFICULTY_LEVELS.findIndex((d) => d.level === difficulty);
  const activeLevel = DIFFICULTY_LEVELS[currentIdx] || DIFFICULTY_LEVELS[1];

  return (
    <div className="bg-white border border-[#E6E1D8] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6E1D8]">
        <div>
          <h3 className="font-editorial text-2xl font-bold text-[#1C2526] flex items-center gap-2">
            <Mountain className="w-6 h-6 text-[#1F4E43]" />
            <span>Đánh giá cấp độ thử thách</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Hệ thống thang đo độ khó chuẩn quốc tế giúp bạn lượng giá thể lực trước khi đăng ký.
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold ${activeLevel.badgeBg} ${activeLevel.badgeText}`}>
          <Activity className="w-4 h-4" />
          <span>Cấp độ: {activeLevel.label} ({activeLevel.sublabel})</span>
        </div>
      </div>

      {/* Visual Difficulty Gauge / 4 Steps */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {DIFFICULTY_LEVELS.map((item, idx) => {
            const isCurrent = item.level === difficulty;
            const isPast = currentIdx >= idx;

            return (
              <div
                key={item.level}
                className={`p-3.5 rounded-2xl border transition-all text-left ${
                  isCurrent
                    ? 'bg-[#1F4E43] text-white border-[#1F4E43] shadow-sm scale-102 ring-2 ring-[#1F4E43]/20'
                    : isPast
                    ? 'bg-[#F7F4EE] text-[#1C2526] border-[#E6E1D8]'
                    : 'bg-[#FAF8F5]/60 text-[#A8A29E] border-[#E6E1D8]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-mono font-bold ${isCurrent ? 'text-emerald-200' : 'text-[#64748B]'}`}>
                    {item.sublabel}
                  </span>
                  {isCurrent && <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />}
                </div>
                <div className="font-bold text-sm sm:text-base">
                  {item.label}
                </div>
                <div className={`text-[11px] mt-1 line-clamp-2 ${isCurrent ? 'text-stone-200' : 'text-[#78716C]'}`}>
                  {item.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fitness & Experience Note */}
      {requiredExperience && (
        <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-2xl p-5 space-y-2">
          <h4 className="text-sm font-bold text-[#1C2526] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#C2410C]" />
            <span>Yêu cầu thể lực & Kinh nghiệm thực tế</span>
          </h4>
          <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed whitespace-pre-line pl-6">
            {requiredExperience}
          </p>
        </div>
      )}
    </div>
  );
};
