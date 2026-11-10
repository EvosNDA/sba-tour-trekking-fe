import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, ShieldCheck, Calendar, Clock, LogOut,
  ArrowRight, RefreshCw, AlertCircle, KeyRound, Compass, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../../stores/auth.store';
import { authApi } from '../../../features/auth/api/auth.api';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import { BookingSummaryResponse } from '../../../features/bookings/types/booking.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { navigateTo } from '../../../lib/navigation';
import { formatDate, formatVND } from '../../../lib/utils';
import { ROUTES } from '../../../constants/routes';
import { toast } from '../../../components/ui/Toast';
import ridgeImage from '../../../assets/images/ta_xua_ridge_walk_1792001302386.jpg';

export const ProfilePage: React.FC = () => {
  const { account, xRole, hasRole } = useAuthStore();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [recentBookings, setRecentBookings] = useState<BookingSummaryResponse[]>([]);
  const [activeHolds, setActiveHolds] = useState<BookingSummaryResponse[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [holdsError, setHoldsError] = useState(false);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const isAdmin = xRole === 'ADMIN' || hasRole('ADMIN');
  const isGuide = xRole === 'GUIDE' || hasRole('GUIDE');

  useEffect(() => {
    let isSubscribed = true;
    setIsLoadingProfile(true);
    setProfileError(false);
    authApi.getMe()
      .catch(() => { if (isSubscribed) setProfileError(true); })
      .finally(() => { if (isSubscribed) setIsLoadingProfile(false); });
    return () => { isSubscribed = false; };
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    setIsLoadingBookings(true);
    setBookingsError(null);
    setHoldsError(false);
    Promise.allSettled([
      bookingsApi.getMyBookings({ page: 0, size: 5 }),
      bookingsApi.getActiveHolds(),
    ]).then(([bookingsRes, holdsRes]) => {
      if (!isSubscribed) return;
      if (bookingsRes.status === 'fulfilled') {
        const content = bookingsRes.value.content || [];
        setRecentBookings(content);
        setTotalBookingsCount(bookingsRes.value.totalElements ?? content.length);
      } else {
        setBookingsError('Chưa thể tải danh sách đặt chỗ. Vui lòng thử lại.');
      }
      if (holdsRes.status === 'fulfilled') {
        setActiveHolds(holdsRes.value || []);
      } else {
        setHoldsError(true);
      }
    }).finally(() => { if (isSubscribed) setIsLoadingBookings(false); });
    return () => { isSubscribed = false; };
  }, [reloadKey]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authApi.logout();
      toast.info('Đã đăng xuất khỏi tài khoản.');
    } catch {
      // logout clears the local session even if the server is unavailable.
    } finally {
      navigateTo(ROUTES.PUBLIC.HOME);
      setIsLoggingOut(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!account?.email || isSendingReset) return;
    setIsSendingReset(true);
    try {
      const res = await authApi.forgotPassword({ email: account.email });
      toast.success(res.message || 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn.');
      navigateTo(`${ROUTES.AUTH.RESET_PASSWORD}?email=${encodeURIComponent(account.email)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi yêu cầu đặt lại mật khẩu.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const displayName = account?.fullName || account?.email || 'Người dùng WeTrek';
  const initials = displayName.split(' ').filter(Boolean).slice(-2).map((s) => s[0]?.toUpperCase()).join('') || 'U';
  const roleLabel = isAdmin ? 'Quản trị viên' : isGuide ? 'Hướng dẫn viên' : 'Thành viên WeTrek';
  const infoRows = [
    { label: 'Họ và tên', value: account?.fullName || 'Chưa cập nhật', icon: User },
    { label: 'Địa chỉ email', value: account?.email || 'Chưa cập nhật', icon: Mail },
    { label: 'Số điện thoại', value: account?.phone || 'Chưa cập nhật', icon: Phone },
    { label: 'Vai trò', value: roleLabel, icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <nav aria-label="Đường dẫn" className="mb-8 flex items-center gap-2 text-sm text-[#6B7068]">
          <a href={ROUTES.PUBLIC.HOME} className="rounded hover:text-[#1F4E43]">Trang chủ</a>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          <span aria-current="page" className="text-[#1C2526]">Hồ sơ cá nhân</span>
        </nav>

        <section aria-labelledby="profile-heading" className="overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white">
          <div className="grid md:grid-cols-[1fr_0.45fr] lg:grid-cols-[1fr_0.5fr]">
            <div className="p-6 sm:p-9 lg:p-10">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#1F4E43]">Không gian của bạn</p>
              <div className="flex items-start gap-4 sm:gap-5">
                <div aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EAF0E9] text-lg font-semibold text-[#1F4E43] sm:h-18 sm:w-18 sm:text-2xl">{initials}</div>
                <div className="min-w-0">
                  <h1 id="profile-heading" className="break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">{displayName}</h1>
                  <p className="mt-2 text-sm text-[#6B7068]">{roleLabel}<span className="mx-2" aria-hidden="true">·</span>Tài khoản #{account?.id || '—'}</p>
                </div>
              </div>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-[#6B7068]">Mọi thông tin và hành trình của bạn, ở cùng một nơi.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button type="button" onClick={() => navigateTo(ROUTES.ACCOUNT.BOOKINGS)} size="lg" rightIcon={<ArrowRight aria-hidden="true" className="h-4 w-4" />} className="min-h-11 text-sm">Đặt chỗ của tôi</Button>
                <Button type="button" variant="ghost" onClick={handleLogout} isLoading={isLoggingOut} leftIcon={<LogOut aria-hidden="true" className="h-4 w-4" />} className="min-h-11 text-[#6B7068]">{isLoggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</Button>
              </div>
            </div>
            <div className="relative hidden min-h-72 overflow-hidden bg-[#1F4E43] md:block">
              <img src={ridgeImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14231F]/85 via-[#14231F]/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white lg:p-9">
                <Compass aria-hidden="true" className="mb-3 h-6 w-6 text-[#F5D8B8]" />
                <p className="max-w-48 text-2xl font-medium leading-tight tracking-tight">Hành trình mới<br />đang chờ bạn.</p>
              </div>
            </div>
          </div>
          <dl aria-label="Tổng quan đặt chỗ" aria-busy={isLoadingBookings} className="grid grid-cols-2 border-t border-[#E6E1D8] bg-[#FAF8F3]">
            <div className="flex flex-col-reverse gap-1 border-r border-[#E6E1D8] px-6 py-5 sm:flex-row sm:items-center sm:gap-4 sm:px-9 lg:px-10">
              <dt className="text-sm text-[#6B7068]">Tổng lượt đặt chỗ</dt>
              <dd className="text-3xl font-medium tabular-nums tracking-tight">{isLoadingBookings || bookingsError ? '—' : totalBookingsCount}</dd>
            </div>
            <div className="flex flex-col-reverse gap-1 px-6 py-5 sm:flex-row sm:items-center sm:gap-4 sm:px-9 lg:px-10">
              <dt className="text-sm text-[#6B7068]">Đang giữ chỗ</dt>
              <dd className="text-3xl font-medium tabular-nums tracking-tight text-[#1F4E43]">{isLoadingBookings || holdsError ? '—' : activeHolds.length}</dd>
            </div>
          </dl>
        </section>

        {!isLoadingBookings && holdsError && (
          <div role="status" className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            <p className="flex-1">Chưa thể kiểm tra các đơn đang giữ chỗ.</p>
            <Button type="button" variant="outline" onClick={() => setReloadKey((key) => key + 1)} className="min-h-10">Thử lại</Button>
          </div>
        )}

        {!isLoadingBookings && !holdsError && activeHolds.length > 0 && (
          <section aria-labelledby="active-holds-heading" className="mt-7 rounded-2xl border border-[#E8D5B6] bg-[#FBF2E5] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Clock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#9A4A15]" />
              <div>
                <h2 id="active-holds-heading" className="text-base font-semibold text-[#6F3B16]">Bạn có {activeHolds.length} đơn đang giữ chỗ</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#795A38]">Hoàn tất thanh toán trước khi hết hạn giữ chỗ để xác nhận hành trình.</p>
              </div>
            </div>
            <div className="mt-4 divide-y divide-[#E8D5B6]">
              {activeHolds.map((hold) => (
                <div key={hold.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 sm:pl-8">
                    <h3 className="break-words text-sm font-semibold">{hold.tourTitle || `Đặt chỗ #${hold.bookingCode || hold.id}`}</h3>
                    <p className="mt-1 text-xs text-[#795A38]">{hold.bookingCode || `#${hold.id}`} · {hold.participantCount} khách</p>
                  </div>
                  <Button type="button" onClick={() => navigateTo(ROUTES.BOOKING.DETAIL(hold.id))} className="min-h-11 shrink-0" rightIcon={<ArrowRight aria-hidden="true" className="h-4 w-4" />}>Tiếp tục thanh toán</Button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 grid items-start gap-8 lg:mt-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          <div className="space-y-8">
            <section aria-labelledby="personal-info-heading" aria-busy={isLoadingProfile} className="rounded-2xl border border-[#E6E1D8] bg-white p-6 sm:p-8">
              <h2 id="personal-info-heading" className="text-xl font-semibold tracking-tight">Thông tin cá nhân</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7068]">Thông tin liên hệ gắn với tài khoản của bạn.</p>
              {isLoadingProfile && <p role="status" className="mt-3 text-xs text-[#6B7068]">Đang cập nhật thông tin…</p>}
              {profileError && <p role="status" className="mt-3 text-xs leading-relaxed text-[#795A38]">Chưa thể làm mới hồ sơ. Bạn đang xem thông tin từ phiên đăng nhập.</p>}
              <dl className="mt-5 divide-y divide-[#E6E1D8]">
                {infoRows.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex gap-3 py-4 first:pt-1 last:pb-0">
                    <Icon aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#6B7068]" />
                    <div className="min-w-0">
                      <dt className="text-xs text-[#6B7068]">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-medium leading-relaxed">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="security-heading" className="px-1 sm:px-2">
              <div className="flex items-center gap-2.5">
                <KeyRound aria-hidden="true" className="h-5 w-5 text-[#1F4E43]" />
                <h2 id="security-heading" className="text-lg font-semibold tracking-tight">Bảo mật tài khoản</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#6B7068]">Cần đổi mật khẩu? Mã xác thực sẽ được gửi đến email của bạn để bắt đầu đặt lại mật khẩu.</p>
              <Button type="button" variant="outline" disabled={!account?.email} isLoading={isSendingReset} onClick={handleRequestPasswordReset} className="mt-4 min-h-11" rightIcon={<ArrowRight aria-hidden="true" className="h-4 w-4" />}>{isSendingReset ? 'Đang gửi mã xác thực…' : 'Đặt lại mật khẩu'}</Button>
            </section>
          </div>

          <div>
            <section aria-labelledby="recent-bookings-heading" aria-busy={isLoadingBookings} className="overflow-hidden rounded-2xl border border-[#E6E1D8] bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E6E1D8] p-6 sm:p-8">
                <div>
                  <h2 id="recent-bookings-heading" className="text-xl font-semibold tracking-tight">Đặt chỗ gần đây</h2>
                  <p className="mt-2 text-sm text-[#6B7068]">Theo dõi hành trình và thông tin vé của bạn.</p>
                </div>
                <a href={ROUTES.ACCOUNT.BOOKINGS} className="inline-flex min-h-10 items-center gap-1.5 rounded text-sm font-semibold text-[#1F4E43] hover:underline">Tất cả<ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
              </div>

              {isLoadingBookings && (
                <div role="status" className="space-y-6 p-6 sm:p-8">
                  <span className="sr-only">Đang tải đặt chỗ…</span>
                  {[1, 2, 3].map((n) => <div key={n} aria-hidden="true" className="h-24 rounded-lg bg-[#F3F0E9] motion-safe:animate-pulse" />)}
                </div>
              )}
              {!isLoadingBookings && bookingsError && (
                <div role="alert" className="p-6 sm:p-8">
                  <AlertCircle aria-hidden="true" className="mb-3 h-6 w-6 text-[#A63A20]" />
                  <p className="text-sm leading-relaxed text-[#6B7068]">{bookingsError}</p>
                  <Button type="button" variant="outline" onClick={() => setReloadKey((key) => key + 1)} className="mt-4 min-h-11" leftIcon={<RefreshCw aria-hidden="true" className="h-4 w-4" />}>Tải lại đặt chỗ</Button>
                </div>
              )}
              {!isLoadingBookings && !bookingsError && recentBookings.length === 0 && (
                <div className="px-6 py-12 text-center sm:px-8 sm:py-16">
                  <Compass aria-hidden="true" className="mx-auto mb-5 h-9 w-9 text-[#1F4E43]" strokeWidth={1.5} />
                  <h3 className="text-xl font-medium tracking-tight">Cung đường đầu tiên đang chờ.</h3>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#6B7068]">Bạn chưa có đặt chỗ nào. Tìm một hành trình phù hợp và bắt đầu chuyến đi của riêng mình.</p>
                  <Button type="button" onClick={() => navigateTo(ROUTES.PUBLIC.TOURS)} className="mt-6 min-h-11" rightIcon={<ArrowRight aria-hidden="true" className="h-4 w-4" />}>Khám phá hành trình</Button>
                </div>
              )}
              {!isLoadingBookings && !bookingsError && recentBookings.length > 0 && (
                <ul className="divide-y divide-[#E6E1D8]">
                  {recentBookings.map((booking) => (
                    <li key={booking.id} className="p-6 sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium tabular-nums text-[#6B7068]">{booking.bookingCode || `#${booking.id}`}</span>
                        <StatusBadge bookingStatus={booking.status} size="sm" />
                      </div>
                      <h3 className="mt-3 break-words text-lg font-semibold leading-snug tracking-tight">{booking.tourTitle || 'Hành trình WeTrek'}</h3>
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6B7068]">
                        {booking.startsAt && <span className="inline-flex items-center gap-1.5"><Calendar aria-hidden="true" className="h-3.5 w-3.5" />{formatDate(booking.startsAt)}</span>}
                        <span>{booking.participantCount} khách</span>
                      </div>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-base font-semibold tabular-nums">{formatVND(booking.totalPriceVnd)}</p>
                        <Button type="button" variant="outline" onClick={() => navigateTo(ROUTES.BOOKING.DETAIL(booking.id))} aria-label={`Xem chi tiết đặt chỗ ${booking.bookingCode || booking.id}`} className="min-h-11" rightIcon={<ArrowRight aria-hidden="true" className="h-4 w-4" />}>Chi tiết đặt chỗ</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <a href={ROUTES.PUBLIC.TOURS} className="group mt-6 flex items-center justify-between gap-5 rounded-xl bg-[#EAF0E9] p-6 text-[#1F4E43] transition-colors hover:bg-[#E0E9DE]">
              <div>
                <p className="text-base font-semibold">Thêm một hành trình đáng nhớ</p>
                <p className="mt-1 text-sm leading-relaxed text-[#53654F]">Tìm cung đường phù hợp cho chuyến đi tiếp theo.</p>
              </div>
              <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform motion-safe:group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
