import React from 'react';
import {
  CheckCircle2,
  XCircle,
  PackageCheck,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface TourServicesSectionProps {
  includedServices?: string | null;
  excludedServices?: string | null;
  routeFileUrl?: string | null;
}

export const TourServicesSection: React.FC<TourServicesSectionProps> = ({
  includedServices,
  excludedServices,
  routeFileUrl,
}) => {
  const parseServiceLines = (raw?: string | null): string[] => {
    if (!raw) return [];
    return raw
      .split(/\r?\n|•|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const includedList = parseServiceLines(includedServices);
  const excludedList = parseServiceLines(excludedServices);

  return (
    <div className="bg-white border border-[#E6E1D8] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
      <div className="pb-4 border-b border-[#E6E1D8]">
        <h3 className="font-editorial text-2xl font-bold text-[#1C2526] flex items-center gap-2">
          <PackageCheck className="w-6 h-6 text-[#1F4E43]" />
          <span>Dịch vụ & Tiêu chuẩn chuyến đi</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Chi tiết danh mục quyền lợi thành viên và chi phí cá nhân trong toàn bộ hành trình.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Included */}
        <div className="bg-[#FAF8F5] border border-emerald-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <h4 className="font-editorial text-lg font-bold">Dịch vụ bao gồm</h4>
          </div>

          {includedList.length > 0 ? (
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#2D3748]">
              {includedList.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#78716C] italic">
              Theo quy chuẩn trọn gói tiêu chuẩn của đơn vị tổ chức.
            </p>
          )}
        </div>

        {/* Excluded */}
        <div className="bg-[#FAF8F5] border border-orange-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-orange-900">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-orange-700" />
            </div>
            <h4 className="font-editorial text-lg font-bold">Không bao gồm</h4>
          </div>

          {excludedList.length > 0 ? (
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#2D3748]">
              {excludedList.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#78716C] italic">
              Chi phí cá nhân ngoài chương trình (nước ngọt, bia, giặt ủi, mua sắm).
            </p>
          )}
        </div>
      </div>

      {/* Route File / GPX attachment */}
      {routeFileUrl && (
        <div className="border border-[#E6E1D8] bg-[#FDFBF7] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F4E43]/10 flex items-center justify-center text-[#1F4E43] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[#1C2526]">
                File lộ trình thực địa (GPX / Route Map)
              </h4>
              <p className="text-xs text-[#64748B]">
                Tập tin tọa độ GPS chính thức hỗ trợ nạp vào đồng hồ hoặc app định vị cá nhân.
              </p>
            </div>
          </div>

          <a
            href={routeFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1F4E43] hover:bg-[#15372F] text-white transition-colors shrink-0"
          >
            <span>Mở file lộ trình</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
