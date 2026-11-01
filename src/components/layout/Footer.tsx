import React from 'react';
import { Shield, Sparkles, CheckCircle, Radio, Mountain } from 'lucide-react';
import { navigateTo } from '../../lib/navigation';
import { ROUTES } from '../../constants/routes';
import { APP_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../stores/auth.store';

export const Footer: React.FC = () => {
  const { account, user, xRole, isAuthenticated } = useAuthStore();
  const isAdmin =
    isAuthenticated &&
    (xRole === 'ADMIN' ||
      user?.role === 'admin' ||
      account?.roles?.some((r) => r.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN'));
  return (
    <footer className="bg-[#F7F4EE] border-t border-[#E6E1D8] mt-16 text-[#1C2526]">
      {/* Three Pillars Certification Badges */}
      <div className="border-b border-[#E6E1D8] py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C2526] mb-1">
                An toàn là ưu tiên số 1
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed mb-1.5">
                Mọi tuyến trekking đều tuân thủ quy chuẩn an toàn đường rừng, trang bị liên lạc vệ tinh và sơ cứu y tế tiêu chuẩn.
              </p>
              <span className="text-[10px] font-mono font-medium text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#E6E1D8]">
                SAFETY STANDARD: VN-ALPINE
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C2526] mb-1">
                Trekking bền vững (Leave No Trace)
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed mb-1.5">
                Tôn trọng hệ sinh thái rừng quốc gia, không xả rác nhựa và đồng hành cùng cộng đồng bản địa phát triển bền vững.
              </p>
              <span className="text-[10px] font-mono font-medium text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#E6E1D8]">
                ECO STEWARDSHIP: CLASS-I
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C2526] mb-1">
                Thanh toán & Giữ chỗ minh bạch
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed mb-1.5">
                Giữ chỗ tự động 15 phút, thanh toán trực tuyến an toàn và xác nhận trạng thái từ máy chủ theo thời gian thực.
              </p>
              <span className="text-[10px] font-mono font-medium text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#E6E1D8]">
                SECURE PAYMENT GATEWAY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Links Grid */}
      <div className="py-10 px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#1F4E43] text-[#B9EADB] flex items-center justify-center">
              <Mountain className="w-4 h-4" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-[#1C2526]">
              WeTrek Vietnam
            </h3>
          </div>
          <p className="text-[#64748B] leading-relaxed mb-4 max-w-md">
            Nền tảng đặt tour trekking và khám phá thiên nhiên có tổ chức. Lịch trình rõ ràng, kiểm tra số chỗ trực tiếp và quản lý hành khách thuận tiện cho từng chuyến đi.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#78716C]">
            <span className="bg-white border border-[#E6E1D8] px-2.5 py-1 rounded">Giữ chỗ 15 phút</span>
            <span className="bg-white border border-[#E6E1D8] px-2.5 py-1 rounded">Giờ Việt Nam (GMT+7)</span>
            <span className="bg-white border border-[#E6E1D8] px-2.5 py-1 rounded">Quét mã VietQR</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">
            Điều hướng
          </h4>
          <ul className="space-y-2.5 text-[#64748B]">
            <li>
              <button
                type="button"
                onClick={() => navigateTo(isAdmin ? ROUTES.ADMIN.DASHBOARD : ROUTES.PUBLIC.HOME)}
                className="hover:text-[#1C2526] cursor-pointer"
              >
                Trang chủ Khám phá
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)}
                className="hover:text-[#1C2526] cursor-pointer"
              >
                Danh sách Tour Trekking
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)}
                className="hover:text-[#1C2526] cursor-pointer"
              >
                Đặt chỗ của tôi
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.AUTH.LOGIN)}
                className="hover:text-[#1C2526] cursor-pointer"
              >
                Đăng nhập / Đăng ký
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">
            Hỗ trợ điều hành
          </h4>
          <div className="space-y-2.5 text-[#64748B]">
            <div>
              <span className="block text-[10px] uppercase font-mono text-[#78716C]">
                Hotline Hỗ trợ 24/7
              </span>
              <a
                href={`tel:${APP_CONFIG.SUPPORT_PHONE}`}
                className="font-bold text-[#C2410C] hover:underline font-mono"
              >
                {APP_CONFIG.SUPPORT_PHONE}
              </a>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-mono text-[#78716C]">
                Email Điều phối & Đối soát
              </span>
              <a
                href={`mailto:${APP_CONFIG.SUPPORT_EMAIL}`}
                className="font-mono text-[#1C2526] hover:underline"
              >
                {APP_CONFIG.SUPPORT_EMAIL}
              </a>
            </div>
            <div className="pt-1">
              <span className="block text-[10px] uppercase font-mono text-[#78716C]">
                Tần số bộ đàm trạm rừng
              </span>
              <span className="font-mono text-[#1C2526] flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#1F4E43]" /> {APP_CONFIG.EMERGENCY_VHF_FREQ}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#E6E1D8] py-4 px-4 md:px-8 text-[11px] text-[#78716C] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>© 2026 WeTrek Expeditions Vietnam. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>
              MÚI GIỜ: <strong className="text-[#1F4E43]">Giờ Việt Nam (GMT+7)</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
