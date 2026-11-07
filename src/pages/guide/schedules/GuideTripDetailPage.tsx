import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Compass,
  MapPin,
  Phone,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Plus,
  Boxes,
  Info,
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toursApi } from '../../../features/tours/api/tours.api';
import { attendanceApi } from '../../../features/tours/api/attendance.api';
import { bookingsApi } from '../../../features/bookings/api/bookings.api';
import { equipmentApi } from '../../../features/equipment/api/equipment.api';
import type {
  ScheduleDetailResponse,
  TourDetailResponse,
} from '../../../features/tours/types/tour.types';
import type {
  ScheduleManifestResponse,
  ScheduleManifestBooking,
  ScheduleParticipantItem,
} from '../../../features/tours/types/attendance.types';
import type {
  EquipmentReservationResponse,
  EquipmentCondition,
} from '../../../features/equipment/types/equipment.types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { toast } from '../../../components/ui/Toast';
import { navigateTo } from '../../../lib/navigation';
import { ROUTES } from '../../../constants/routes';
import { formatDateTime, formatTimeOnly, formatDate } from '../../../lib/utils';

export interface GuideTripDetailPageProps {
  scheduleIdProp?: number;
}

export const GuideTripDetailPage: React.FC<GuideTripDetailPageProps> = ({
  scheduleIdProp,
}) => {
  // Extract scheduleId from prop or URL
  const scheduleId = useMemo(() => {
    if (scheduleIdProp) return scheduleIdProp;
    const match = window.location.pathname.match(/\/guide\/schedules\/(\d+)/);
    return match ? Number(match[1]) : 0;
  }, [scheduleIdProp]);

  // Main state
  const [activeTab, setActiveTab] = useState<'attendance' | 'equipment'>('attendance');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scheduleDetail, setScheduleDetail] = useState<ScheduleDetailResponse | null>(null);
  const [tourDetail, setTourDetail] = useState<TourDetailResponse | null>(null);

  // Manifest and bookings
  const [manifestAvailable, setManifestAvailable] = useState<boolean | null>(null);
  const [bookings, setBookings] = useState<ScheduleManifestBooking[]>([]);
  const [equipmentReservations, setEquipmentReservations] = useState<Record<number, EquipmentReservationResponse>>({});

  // Search & filter
  const [searchGuest, setSearchGuest] = useState<string>('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT'>('ALL');

  // Manual booking lookup tool (due to missing manifest API)
  const [manualBookingId, setManualBookingId] = useState<string>('');
  const [isLookingUpBooking, setIsLookingUpBooking] = useState<boolean>(false);

  // Check-in modal state
  const [checkInModal, setCheckInModal] = useState<{
    open: boolean;
    participant: ScheduleParticipantItem | null;
    isSaving: boolean;
    note: string;
    errorMessage: string;
  }>({
    open: false,
    participant: null,
    isSaving: false,
    note: '',
    errorMessage: '',
  });

  // Check-out modal state
  const [checkOutModal, setCheckOutModal] = useState<{
    open: boolean;
    participant: ScheduleParticipantItem | null;
    isSaving: boolean;
    note: string;
    errorMessage: string;
  }>({
    open: false,
    participant: null,
    isSaving: false,
    note: '',
    errorMessage: '',
  });

  // Equipment Issue modal state
  const [issueModal, setIssueModal] = useState<{
    open: boolean;
    bookingId: number | null;
    isSaving: boolean;
    note: string;
    items: Record<number, number>; // equipmentId -> quantity
    errorMessage: string;
  }>({
    open: false,
    bookingId: null,
    isSaving: false,
    note: '',
    items: {},
    errorMessage: '',
  });

  // Equipment Return modal state
  const [returnModal, setReturnModal] = useState<{
    open: boolean;
    bookingId: number | null;
    isSaving: boolean;
    note: string;
    items: Record<number, { quantity: number; condition: EquipmentCondition }>;
    errorMessage: string;
  }>({
    open: false,
    bookingId: null,
    isSaving: false,
    note: '',
    items: {},
    errorMessage: '',
  });

  // Fetch initial schedule details
  const fetchTripData = useCallback(async () => {
    if (!scheduleId) return;
    setIsLoading(true);

    try {
      // 1. Try to fetch schedule manifest first
      try {
        const manifest = await attendanceApi.getScheduleManifest(scheduleId);
        setManifestAvailable(true);
        setBookings(manifest.bookings || []);
      } catch (err: any) {
        // Manifest API is not yet provided by backend (404/501)
        setManifestAvailable(false);
      }

      // 2. Fetch schedule detail using existing schedule API
      // We look up schedule across tours or fetch latest
      try {
        const now = new Date();
        const start = new Date(now.getTime() - 30 * 86400000);
        const end = new Date(now.getTime() + 60 * 86400000);
        const range = await toursApi.listSchedulesInRange(start.toISOString(), end.toISOString());
        const matched = range.find((s) => s.id === scheduleId);

        if (matched) {
          const detail = await toursApi.getScheduleDetail(matched.tourId, scheduleId);
          setScheduleDetail(detail);

          const tour = await toursApi.getTourDetail(matched.tourId);
          setTourDetail(tour);
        }
      } catch {
        // Fallback if lookup in range fails
      }
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchTripData();
  }, [fetchTripData]);

  // Lookup equipment reservation when a booking is added
  const loadEquipmentForBooking = useCallback(async (bId: number) => {
    try {
      const res = await equipmentApi.getBookingEquipmentReservation(bId);
      setEquipmentReservations((prev) => ({ ...prev, [bId]: res }));
    } catch {
      // Booking has no equipment reservation or not permitted
    }
  }, []);

  // Manual Booking Lookup handler (Solves the missing manifest backend gap)
  const handleLookupBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = Number(manualBookingId.trim());
    if (!idNum || isNaN(idNum)) {
      toast.error('Vui lòng nhập mã ID đặt chỗ hợp lệ (số nguyên).');
      return;
    }

    if (bookings.some((b) => b.bookingId === idNum)) {
      toast.info(`Đặt chỗ #${idNum} đã có trong danh sách chuyến.`);
      return;
    }

    setIsLookingUpBooking(true);
    try {
      const bDetail = await bookingsApi.getBookingDetail(idNum);

      // Verify that the booking belongs to this schedule
      if (bDetail.scheduleId && bDetail.scheduleId !== scheduleId) {
        toast.warning(
          `Đặt chỗ #${idNum} thuộc lịch khởi hành #${bDetail.scheduleId}, khác với lịch #${scheduleId} hiện tại!`
        );
      }

      // Convert passengers
      const passengers: ScheduleParticipantItem[] = (bDetail.passengers || []).map((p) => ({
        participantId: p.id,
        bookingId: bDetail.id,
        bookingCode: bDetail.bookingCode || `BK-${bDetail.id}`,
        fullName: p.fullName,
        phone: p.phone,
        email: p.email,
        bookingCustomer: p.bookingCustomer,
        checkedIn: false,
        checkedOut: false,
      }));

      const newBooking: ScheduleManifestBooking = {
        bookingId: bDetail.id,
        bookingCode: bDetail.bookingCode || `BK-${bDetail.id}`,
        customerName: bDetail.passengers?.find((p) => p.bookingCustomer)?.fullName || 'Khách đặt',
        status: bDetail.status || 'CONFIRMED',
        passengers,
      };

      setBookings((prev) => [newBooking, ...prev]);
      setManualBookingId('');
      toast.success(`Đã nạp thành công ${passengers.length} khách từ đặt chỗ #${idNum}.`);

      // Attempt to load equipment reservation for this booking
      loadEquipmentForBooking(idNum);
    } catch (err: any) {
      toast.error(
        err?.message ||
          `Không thể tải thông tin đặt chỗ #${idNum}. Hãy chắc chắn rằng tài khoản có quyền truy cập hoặc đúng mã booking.`
      );
    } finally {
      setIsLookingUpBooking(false);
    }
  };

  // Perform Check-in action via real backend API
  const handleExecuteCheckIn = async () => {
    if (!checkInModal.participant) return;
    const p = checkInModal.participant;

    setCheckInModal((prev) => ({ ...prev, isSaving: true, errorMessage: '' }));
    try {
      const res = await attendanceApi.checkInParticipant(
        scheduleId,
        p.bookingId,
        p.participantId,
        {
          note: checkInModal.note.trim() || undefined,
        }
      );

      // Success: Update participant state with actual backend response
      setBookings((prevBookings) =>
        prevBookings.map((b) => {
          if (b.bookingId !== p.bookingId) return b;
          return {
            ...b,
            passengers: b.passengers.map((pass) => {
              if (pass.participantId !== p.participantId) return pass;
              return {
                ...pass,
                checkedIn: true,
                checkedInAt: res.checkedInAt,
                checkedInBy: res.checkedInBy,
                note: res.note,
              };
            }),
          };
        })
      );

      toast.success(`Đã điểm danh thành công cho khách ${p.fullName}!`);
      setCheckInModal({
        open: false,
        participant: null,
        isSaving: false,
        note: '',
        errorMessage: '',
      });
    } catch (err: any) {
      const msg =
        err?.message ||
        'Ghi nhận điểm danh không thành công. Vui lòng kiểm tra lại quyền phân công hoặc thông tin đặt chỗ.';
      setCheckInModal((prev) => ({ ...prev, isSaving: false, errorMessage: msg }));
    }
  };

  // Perform Check-out action via real backend API
  const handleExecuteCheckOut = async () => {
    if (!checkOutModal.participant) return;
    const p = checkOutModal.participant;

    setCheckOutModal((prev) => ({ ...prev, isSaving: true, errorMessage: '' }));
    try {
      const res = await attendanceApi.checkOutParticipant(
        scheduleId,
        p.bookingId,
        p.participantId,
        {
          note: checkOutModal.note.trim() || undefined,
        }
      );

      // Success: Update participant state with actual backend response
      setBookings((prevBookings) =>
        prevBookings.map((b) => {
          if (b.bookingId !== p.bookingId) return b;
          return {
            ...b,
            passengers: b.passengers.map((pass) => {
              if (pass.participantId !== p.participantId) return pass;
              return {
                ...pass,
                checkedOut: true,
                checkedOutAt: res.checkedOutAt,
                checkedOutBy: res.checkedOutBy,
                note: res.note || pass.note,
              };
            }),
          };
        })
      );

      toast.success(`Đã ghi nhận hoàn tất chuyến cho khách ${p.fullName}!`);
      setCheckOutModal({
        open: false,
        participant: null,
        isSaving: false,
        note: '',
        errorMessage: '',
      });
    } catch (err: any) {
      const msg =
        err?.message ||
        'Ghi nhận kết thúc chuyến không thành công. Khách cần phải được điểm danh trước khi hoàn tất.';
      setCheckOutModal((prev) => ({ ...prev, isSaving: false, errorMessage: msg }));
    }
  };

  // Perform Equipment Issue via real backend API
  const handleExecuteIssue = async () => {
    if (!issueModal.bookingId) return;
    const bId = issueModal.bookingId;

    const itemsToIssue = Object.entries(issueModal.items)
      .filter(([_, qty]) => qty > 0)
      .map(([eqId, qty]) => ({
        equipmentId: Number(eqId),
        quantity: qty,
        condition: 'GOOD' as const,
      }));

    if (itemsToIssue.length === 0) {
      setIssueModal((prev) => ({
        ...prev,
        errorMessage: 'Vui lòng nhập số lượng thực giao lớn hơn 0 cho ít nhất một món.',
      }));
      return;
    }

    setIssueModal((prev) => ({ ...prev, isSaving: true, errorMessage: '' }));
    try {
      const res = await equipmentApi.issueBookingEquipment(bId, {
        note: issueModal.note.trim() || undefined,
        items: itemsToIssue,
      });

      setEquipmentReservations((prev) => ({ ...prev, [bId]: res }));
      toast.success('Bàn giao thiết bị cho khách thành công!');
      setIssueModal({
        open: false,
        bookingId: null,
        isSaving: false,
        note: '',
        items: {},
        errorMessage: '',
      });
    } catch (err: any) {
      setIssueModal((prev) => ({
        ...prev,
        isSaving: false,
        errorMessage:
          err?.message ||
          'Không thể ghi nhận bàn giao thiết bị. Vui lòng kiểm tra lại số lượng tồn và trạng thái đặt chỗ.',
      }));
    }
  };

  // Perform Equipment Return via real backend API
  const handleExecuteReturn = async () => {
    if (!returnModal.bookingId) return;
    const bId = returnModal.bookingId;

    const itemsToReturn = Object.entries(returnModal.items)
      .filter(([_, data]) => data.quantity > 0)
      .map(([eqId, data]) => ({
        equipmentId: Number(eqId),
        quantity: data.quantity,
        condition: data.condition,
      }));

    if (itemsToReturn.length === 0) {
      setReturnModal((prev) => ({
        ...prev,
        errorMessage: 'Vui lòng nhập số lượng thực thu hồi lớn hơn 0 cho ít nhất một món.',
      }));
      return;
    }

    setReturnModal((prev) => ({ ...prev, isSaving: true, errorMessage: '' }));
    try {
      const res = await equipmentApi.returnBookingEquipment(bId, {
        note: returnModal.note.trim() || undefined,
        items: itemsToReturn,
      });

      setEquipmentReservations((prev) => ({ ...prev, [bId]: res }));
      toast.success('Thu hồi và kiểm kê thiết bị thành công!');
      setReturnModal({
        open: false,
        bookingId: null,
        isSaving: false,
        note: '',
        items: {},
        errorMessage: '',
      });
    } catch (err: any) {
      setReturnModal((prev) => ({
        ...prev,
        isSaving: false,
        errorMessage:
          err?.message ||
          'Không thể thu hồi thiết bị. Số lượng trả không được vượt quá số lượng đã giao.',
      }));
    }
  };

  // Flatten participants and calculate statistics
  const allParticipants = useMemo(() => {
    return bookings.flatMap((b) => b.passengers);
  }, [bookings]);

  const stats = useMemo(() => {
    const total = allParticipants.length;
    const checkedIn = allParticipants.filter((p) => p.checkedIn).length;
    const checkedOut = allParticipants.filter((p) => p.checkedOut).length;
    const pending = total - checkedIn;

    return { total, checkedIn, checkedOut, pending };
  }, [allParticipants]);

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    return allParticipants.filter((p) => {
      // 1. Search term (name, phone, booking code)
      if (searchGuest.trim()) {
        const q = searchGuest.toLowerCase().trim();
        const matchesName = (p.fullName || '').toLowerCase().includes(q);
        const matchesPhone = (p.phone || '').toLowerCase().includes(q);
        const matchesCode = (p.bookingCode || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesCode) return false;
      }

      // 2. Attendance status
      if (attendanceFilter === 'PENDING') return !p.checkedIn;
      if (attendanceFilter === 'CHECKED_IN') return p.checkedIn && !p.checkedOut;
      if (attendanceFilter === 'CHECKED_OUT') return p.checkedOut;

      return true;
    });
  }, [allParticipants, searchGuest, attendanceFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigateTo(ROUTES.GUIDE.SCHEDULES)}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách lịch tour</span>
        </button>

        <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-bold">
          LỊCH KHỞI HÀNH #{scheduleId}
        </span>
      </div>

      {/* Main Tour & Trip Overview Card */}
      <div className="bg-white rounded-2xl border border-[#E6E1D8] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-[#1F4E43] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Chi tiết chuyến dẫn đoàn
              </span>
              {scheduleDetail?.status && (
                <StatusBadge scheduleStatus={scheduleDetail.status} size="sm" />
              )}
            </div>
            <h1 className="font-editorial text-xl sm:text-2xl lg:text-3xl font-bold text-[#1C2526]">
              {tourDetail?.title || `Tour Trekking #${scheduleDetail?.tourId || ''}`}
            </h1>
          </div>

          <div className="text-left md:text-right font-mono text-xs text-stone-500 shrink-0">
            <div>Sức chứa: <strong>{scheduleDetail?.capacity ?? '—'} khách</strong></div>
            <div>Đã xác nhận: <strong className="text-emerald-700">{scheduleDetail?.confirmedSeats ?? '—'} chỗ</strong></div>
          </div>
        </div>

        {/* Departure & Logistics Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-xs sm:text-sm text-stone-700 border-t border-stone-100">
          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
            <div>
              <div className="text-stone-500 text-[11px]">Thời gian khởi hành:</div>
              <div className="font-semibold text-stone-900">
                {scheduleDetail ? formatDateTime(scheduleDetail.startsAt) : 'Đang tải...'}
              </div>
              <div className="text-[11px] text-stone-500">
                Kết thúc: {scheduleDetail ? formatDateTime(scheduleDetail.endsAt) : '—'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
            <div>
              <div className="text-stone-500 text-[11px]">Điểm tập trung đón khách:</div>
              <div className="font-semibold text-stone-900">
                {scheduleDetail?.meetingPoint || 'Theo thông báo của ban tổ chức'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-[#1F4E43] shrink-0 mt-0.5" />
            <div>
              <div className="text-stone-500 text-[11px]">Hotline khẩn cấp đoàn:</div>
              <div className="font-semibold text-stone-900">
                {scheduleDetail?.contactPhone || '1900 8888 (WeTrek Support)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Real-time Attendance Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 text-center shadow-2xs">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1C2526]">
            {stats.total}
          </div>
          <div className="text-xs text-stone-500 mt-0.5 font-medium">Tổng số khách</div>
        </div>

        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 text-center shadow-2xs">
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800">
            {stats.checkedIn}
          </div>
          <div className="text-xs text-emerald-700 mt-0.5 font-medium">Đã điểm danh</div>
        </div>

        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 text-center shadow-2xs">
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-800">
            {stats.checkedOut}
          </div>
          <div className="text-xs text-blue-700 mt-0.5 font-medium">Đã hoàn thành tour</div>
        </div>

        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-center shadow-2xs">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-800">
            {stats.pending}
          </div>
          <div className="text-xs text-amber-700 mt-0.5 font-medium">Chưa có mặt</div>
        </div>
      </div>

      {/* Manual Booking Lookup Bar */}
      {manifestAvailable === false && (
        <div className="bg-white rounded-2xl border border-[#E6E1D8] p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <span className="font-bold text-stone-900 block">
                Tra cứu danh sách hành khách theo đơn đặt chỗ
              </span>
              <p className="text-stone-600 leading-relaxed">
                Nhập mã đơn đặt chỗ để tải thông tin thành viên, thực hiện điểm danh và kiểm tra thiết bị thuê của khách.
              </p>
            </div>
          </div>

          <form onSubmit={handleLookupBooking} className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="number"
              min="1"
              value={manualBookingId}
              onChange={(e) => setManualBookingId(e.target.value)}
              placeholder="Nhập mã đơn đặt chỗ (Ví dụ: 1, 42...)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/30"
            />
            <button
              type="submit"
              disabled={isLookingUpBooking || !manualBookingId.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isLookingUpBooking ? 'Đang tìm...' : 'Thêm vào danh sách'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Navigation Tabs (Mobile-Friendly touch targets >= 44px) */}
      <div className="flex border-b border-[#E6E1D8] gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`min-h-[44px] py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'border-[#1F4E43] text-[#1F4E43]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Điểm danh hành khách ({stats.checkedIn}/{stats.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('equipment')}
          className={`min-h-[44px] py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
            activeTab === 'equipment'
              ? 'border-[#1F4E43] text-[#1F4E43]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>2. Giao nhận & Thu hồi Thiết bị</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ATTENDANCE (CHECK-IN / CHECK-OUT)                        */}
      {/* ============================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-[#E6E1D8] p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchGuest}
                onChange={(e) => setSearchGuest(e.target.value)}
                placeholder="Tìm tên khách, số điện thoại, mã booking..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/30"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(
                [
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'PENDING', label: 'Chưa điểm danh' },
                  { id: 'CHECKED_IN', label: 'Đã check-in' },
                  { id: 'CHECKED_OUT', label: 'Đã check-out' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAttendanceFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    attendanceFilter === f.id
                      ? 'bg-[#1F4E43] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Cards / Table */}
          {filteredParticipants.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center space-y-2">
              <Users className="w-10 h-10 text-stone-400 mx-auto" />
              <h4 className="font-bold text-stone-800 text-sm">
                Chưa có hành khách nào hiển thị
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {allParticipants.length === 0
                  ? 'Hãy nhập mã ID đơn đặt chỗ ở khung trên để nạp danh sách khách vào chuyến.'
                  : 'Không có hành khách nào phù hợp với bộ lọc tìm kiếm.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredParticipants.map((p) => {
                const currentStatus: 'checked_out' | 'checked_in' | 'pending' = p.checkedOut
                  ? 'checked_out'
                  : p.checkedIn
                  ? 'checked_in'
                  : 'pending';

                return (
                  <div
                    key={`${p.bookingId}-${p.participantId}`}
                    className="bg-white rounded-2xl border border-[#E6E1D8] p-5 shadow-2xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-stone-900 leading-snug">
                              {p.fullName}
                            </h3>
                            {p.bookingCustomer && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-300 uppercase">
                                Trưởng đoàn
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-stone-500 block mt-0.5">
                            Đặt chỗ: #{p.bookingId} ({p.bookingCode})
                          </span>
                        </div>
                        <StatusBadge attendanceStatus={currentStatus} size="sm" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-stone-600 pt-1">
                        <div>SĐT: <strong className="text-stone-900">{p.phone || 'Chưa cung cấp'}</strong></div>
                        <div>Email: <span className="font-mono text-stone-800">{p.email || '—'}</span></div>
                      </div>

                      {/* Timestamps if recorded */}
                      {(p.checkedInAt || p.checkedOutAt || p.note) && (
                        <div className="bg-stone-50 rounded-xl p-2.5 text-[11px] text-stone-600 space-y-1 font-mono border border-stone-200/60">
                          {p.checkedInAt && (
                            <div>
                              ✓ Check-in lúc: <strong>{formatDateTime(p.checkedInAt)}</strong>
                              {p.checkedInBy ? ` (Bởi #${p.checkedInBy})` : ''}
                            </div>
                          )}
                          {p.checkedOutAt && (
                            <div className="text-blue-900">
                              ✓ Check-out lúc: <strong>{formatDateTime(p.checkedOutAt)}</strong>
                              {p.checkedOutBy ? ` (Bởi #${p.checkedOutBy})` : ''}
                            </div>
                          )}
                          {p.note && (
                            <div className="text-stone-700 italic font-sans pt-0.5">
                              Ghi chú: "{p.note}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      {!p.checkedIn ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCheckInModal({
                              open: true,
                              participant: p,
                              isSaving: false,
                              note: '',
                              errorMessage: '',
                            })
                          }
                          className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Check className="w-4 h-4" />
                          <span>Ghi nhận Check-in</span>
                        </button>
                      ) : !p.checkedOut ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCheckOutModal({
                              open: true,
                              participant: p,
                              isSaving: false,
                              note: '',
                              errorMessage: '',
                            })
                          }
                          className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Ghi nhận Check-out</span>
                        </button>
                      ) : (
                        <div className="flex-1 py-2 text-center text-xs font-semibold text-blue-700 bg-blue-50 rounded-xl">
                          Đã hoàn tất hành trình
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: EQUIPMENT HANDOVER & RETURN                             */}
      {/* ============================================================== */}
      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs sm:text-sm text-emerald-950 space-y-1">
            <span className="font-bold block">Quy trình bàn giao & thu hồi thiết bị</span>
            <p className="text-emerald-900 leading-relaxed">
              Trước khi khởi hành, Guide bàn giao và ghi nhận số lượng thực giao. Cuối hành trình, Guide thu hồi thiết bị, nhập số lượng thực nhận và đánh dấu tình trạng: <strong>Tốt (GOOD)</strong> hoặc <strong>Cần bảo dưỡng (NEEDS_INSPECTION)</strong>.
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center space-y-2">
              <Boxes className="w-10 h-10 text-stone-400 mx-auto" />
              <h4 className="font-bold text-stone-800 text-sm">
                Chưa có đơn đặt chỗ nào trong chuyến
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Hãy nạp mã ID đơn đặt chỗ ở trên để xem danh sách thiết bị cần bàn giao.
              </p>
            </div>
          ) : (
            bookings.map((booking) => {
              const res = equipmentReservations[booking.bookingId];
              const items = res?.items || [];

              return (
                <div
                  key={booking.bookingId}
                  className="bg-white rounded-2xl border border-[#E6E1D8] p-5 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900 text-base">
                          Đơn đặt chỗ #{booking.bookingId} ({booking.bookingCode})
                        </h3>
                        {res?.status && (
                          <StatusBadge equipmentReservationStatus={res.status} size="sm" />
                        )}
                      </div>
                      <span className="text-xs text-stone-500 block mt-0.5">
                        Khách đặt: <strong>{booking.customerName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadEquipmentForBooking(booking.bookingId)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
                      >
                        Tải lại thiết bị
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const initialItems: Record<number, number> = {};
                          items.forEach((it) => {
                            const remaining = it.quantity - it.issuedQuantity;
                            if (remaining > 0) initialItems[it.equipmentId] = remaining;
                          });
                          setIssueModal({
                            open: true,
                            bookingId: booking.bookingId,
                            isSaving: false,
                            note: '',
                            items: initialItems,
                            errorMessage: '',
                          });
                        }}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Boxes className="w-4 h-4" />
                        <span>Bàn giao thiết bị</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const initialItems: Record<number, { quantity: number; condition: EquipmentCondition }> = {};
                          items.forEach((it) => {
                            const toReturn = it.issuedQuantity - it.returnedQuantity;
                            if (toReturn > 0) {
                              initialItems[it.equipmentId] = {
                                quantity: toReturn,
                                condition: 'GOOD',
                              };
                            }
                          });
                          setReturnModal({
                            open: true,
                            bookingId: booking.bookingId,
                            isSaving: false,
                            note: '',
                            items: initialItems,
                            errorMessage: '',
                          });
                        }}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Thu hồi cuối chuyến</span>
                      </button>
                    </div>
                  </div>

                  {/* Equipment items table */}
                  {!res ? (
                    <div className="py-4 text-center text-xs text-stone-500">
                      Bấm "Tải lại thiết bị" để kiểm tra danh mục đồ thuê của đơn này.
                    </div>
                  ) : items.length === 0 ? (
                    <div className="py-4 text-center text-xs text-stone-500 bg-stone-50 rounded-xl">
                      Đơn đặt chỗ này không thuê thiết bị từ hệ thống (Khách tự chuẩn bị đồ dùng).
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#F7F4EE] border-b border-[#E6E1D8] text-[11px] font-mono uppercase text-stone-600">
                            <th className="py-2.5 px-3">Tên thiết bị</th>
                            <th className="py-2.5 px-3 text-center">Đã đặt</th>
                            <th className="py-2.5 px-3 text-center">Đã giao</th>
                            <th className="py-2.5 px-3 text-center">Đã thu hồi</th>
                            <th className="py-2.5 px-3 text-center">Còn cần thu hồi</th>
                            <th className="py-2.5 px-3 text-right">Tình trạng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {items.map((it) => {
                            const pendingReturn = it.issuedQuantity - it.returnedQuantity;
                            return (
                              <tr key={it.equipmentId} className="hover:bg-stone-50">
                                <td className="py-3 px-3 font-semibold text-stone-900">
                                  {it.equipmentName}
                                  <span className="block font-mono text-[10px] text-stone-400">
                                    ID: #{it.equipmentId}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-stone-800">
                                  {it.quantity}
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                                  {it.issuedQuantity}
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-teal-700">
                                  {it.returnedQuantity}
                                </td>
                                <td className="py-3 px-3 text-center font-mono">
                                  {pendingReturn > 0 ? (
                                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 font-bold">
                                      {pendingReturn} món
                                    </span>
                                  ) : (
                                    <span className="text-stone-400">0</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  {it.issuedQuantity === 0 ? (
                                    <span className="text-stone-500 font-medium">Chưa giao</span>
                                  ) : pendingReturn === 0 ? (
                                    <span className="text-teal-700 font-semibold">Đã hoàn tất</span>
                                  ) : (
                                    <span className="text-orange-700 font-semibold">Đang sử dụng</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CHECK-IN WITH NOTE                                      */}
      {/* ============================================================== */}
      {checkInModal.open && checkInModal.participant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl space-y-4 font-sans">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-stone-900">
                  Điểm danh khách khởi hành
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Xác nhận khách đã có mặt tại điểm đón trước khi xuất phát.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCheckInModal({
                    open: false,
                    participant: null,
                    isSaving: false,
                    note: '',
                    errorMessage: '',
                  })
                }
                className="text-stone-400 hover:text-stone-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 text-xs space-y-1">
              <div>Hành khách: <strong className="text-stone-900">{checkInModal.participant.fullName}</strong></div>
              <div>Mã đặt chỗ: <span className="font-mono">#{checkInModal.participant.bookingId}</span></div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="checkin-note" className="text-xs font-semibold text-stone-700 flex justify-between">
                <span>Ghi chú điểm danh (Không bắt buộc)</span>
                <span className="font-mono text-stone-400">{checkInModal.note.length}/1000</span>
              </label>
              <textarea
                id="checkin-note"
                maxLength={1000}
                rows={3}
                value={checkInModal.note}
                onChange={(e) =>
                  setCheckInModal((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Ví dụ: Đã có mặt đúng giờ, tự túc di chuyển đến bến..."
                className="w-full p-3 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/30"
              />
            </div>

            {checkInModal.errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {checkInModal.errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={checkInModal.isSaving}
                onClick={() =>
                  setCheckInModal({
                    open: false,
                    participant: null,
                    isSaving: false,
                    note: '',
                    errorMessage: '',
                  })
                }
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={checkInModal.isSaving}
                onClick={handleExecuteCheckIn}
                className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {checkInModal.isSaving ? 'Đang lưu...' : 'Xác nhận Điểm danh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CHECK-OUT WITH NOTE                                     */}
      {/* ============================================================== */}
      {checkOutModal.open && checkOutModal.participant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl space-y-4 font-sans">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-stone-900">
                  Ghi nhận Check-out cuối hành trình
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Xác nhận khách đã hoàn thành chuyến an toàn và hoàn trả trang thiết bị.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCheckOutModal({
                    open: false,
                    participant: null,
                    isSaving: false,
                    note: '',
                    errorMessage: '',
                  })
                }
                className="text-stone-400 hover:text-stone-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 text-xs space-y-1">
              <div>Hành khách: <strong className="text-stone-900">{checkOutModal.participant.fullName}</strong></div>
              <div>Mã đặt chỗ: <span className="font-mono">#{checkOutModal.participant.bookingId}</span></div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="checkout-note" className="text-xs font-semibold text-stone-700 flex justify-between">
                <span>Ghi chú check-out (Không bắt buộc)</span>
                <span className="font-mono text-stone-400">{checkOutModal.note.length}/1000</span>
              </label>
              <textarea
                id="checkout-note"
                maxLength={1000}
                rows={3}
                value={checkOutModal.note}
                onChange={(e) =>
                  setCheckOutModal((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Ví dụ: Đã trả phòng, hoàn tất chuyến, sức khỏe tốt..."
                className="w-full p-3 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/30"
              />
            </div>

            {checkOutModal.errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {checkOutModal.errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={checkOutModal.isSaving}
                onClick={() =>
                  setCheckOutModal({
                    open: false,
                    participant: null,
                    isSaving: false,
                    note: '',
                    errorMessage: '',
                  })
                }
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={checkOutModal.isSaving}
                onClick={handleExecuteCheckOut}
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {checkOutModal.isSaving ? 'Đang lưu...' : 'Xác nhận Check-out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EQUIPMENT ISSUE                                         */}
      {/* ============================================================== */}
      {issueModal.open && issueModal.bookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-stone-900">
                  Bàn giao thiết bị cho khách
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Nhập số lượng thực tế đã bàn giao cho đơn đặt chỗ #{issueModal.bookingId}.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setIssueModal({
                    open: false,
                    bookingId: null,
                    isSaving: false,
                    note: '',
                    items: {},
                    errorMessage: '',
                  })
                }
                className="text-stone-400 hover:text-stone-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(equipmentReservations[issueModal.bookingId]?.items || []).map((it) => {
                const maxAvailable = it.quantity - it.issuedQuantity;
                const currentVal = issueModal.items[it.equipmentId] ?? 0;

                return (
                  <div
                    key={it.equipmentId}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-stone-900">{it.equipmentName}</div>
                      <div className="text-stone-500 text-[11px]">
                        Đặt: {it.quantity} • Đã giao: {it.issuedQuantity} • Còn chưa giao:{' '}
                        <strong className="text-emerald-700">{maxAvailable}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label htmlFor={`issue-qty-${it.equipmentId}`} className="text-[11px] text-stone-500">Giao:</label>
                      <input
                        id={`issue-qty-${it.equipmentId}`}
                        type="number"
                        min="0"
                        max={maxAvailable}
                        value={currentVal}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(maxAvailable, Number(e.target.value) || 0));
                          setIssueModal((prev) => ({
                            ...prev,
                            items: { ...prev.items, [it.equipmentId]: v },
                          }));
                        }}
                        className="w-20 px-2 py-1.5 rounded-lg border border-stone-300 font-mono text-center font-bold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1">
              <label htmlFor="issue-note" className="text-xs font-semibold text-stone-700">Ghi chú bàn giao</label>
              <input
                id="issue-note"
                type="text"
                value={issueModal.note}
                onChange={(e) => setIssueModal((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Ví dụ: Đã kiểm tra gậy leo núi, khóa ba lô trước khi giao..."
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            {issueModal.errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {issueModal.errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={issueModal.isSaving}
                onClick={() =>
                  setIssueModal({
                    open: false,
                    bookingId: null,
                    isSaving: false,
                    note: '',
                    items: {},
                    errorMessage: '',
                  })
                }
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={issueModal.isSaving}
                onClick={handleExecuteIssue}
                className="px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {issueModal.isSaving ? 'Đang lưu...' : 'Xác nhận Bàn giao'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EQUIPMENT RETURN                                        */}
      {/* ============================================================== */}
      {returnModal.open && returnModal.bookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-stone-900">
                  Thu hồi thiết bị cuối chuyến
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Kiểm đếm số lượng thu hồi và đánh dấu tình trạng cho đơn đặt chỗ #{returnModal.bookingId}.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setReturnModal({
                    open: false,
                    bookingId: null,
                    isSaving: false,
                    note: '',
                    items: {},
                    errorMessage: '',
                  })
                }
                className="text-stone-400 hover:text-stone-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(equipmentReservations[returnModal.bookingId]?.items || []).map((it) => {
                const maxToReturn = it.issuedQuantity - it.returnedQuantity;
                const currentData = returnModal.items[it.equipmentId] || {
                  quantity: 0,
                  condition: 'GOOD',
                };

                return (
                  <div
                    key={it.equipmentId}
                    className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-stone-900">{it.equipmentName}</div>
                      <div className="text-stone-500 text-[11px]">
                        Đã giao: {it.issuedQuantity} • Đã trả: {it.returnedQuantity} • Cần trả:{' '}
                        <strong className="text-orange-700">{maxToReturn}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`return-qty-${it.equipmentId}`} className="text-[11px] text-stone-500 whitespace-nowrap">
                          Số lượng nhận:
                        </label>
                        <input
                          id={`return-qty-${it.equipmentId}`}
                          type="number"
                          min="0"
                          max={maxToReturn}
                          value={currentData.quantity}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(maxToReturn, Number(e.target.value) || 0));
                            setReturnModal((prev) => ({
                              ...prev,
                              items: {
                                ...prev.items,
                                [it.equipmentId]: {
                                  ...currentData,
                                  quantity: v,
                                },
                              },
                            }));
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-stone-300 font-mono text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label htmlFor={`return-cond-${it.equipmentId}`} className="text-[11px] text-stone-500 whitespace-nowrap">
                          Tình trạng:
                        </label>
                        <select
                          id={`return-cond-${it.equipmentId}`}
                          value={currentData.condition}
                          onChange={(e) => {
                            const c = e.target.value as EquipmentCondition;
                            setReturnModal((prev) => ({
                              ...prev,
                              items: {
                                ...prev.items,
                                [it.equipmentId]: {
                                  ...currentData,
                                  condition: c,
                                },
                              },
                            }));
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold"
                        >
                          <option value="GOOD">Đạt tiêu chuẩn (Tốt)</option>
                          <option value="NEEDS_INSPECTION">Cần kiểm tra / Bảo trì</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1">
              <label htmlFor="return-note" className="text-xs font-semibold text-stone-700">Ghi chú thu hồi</label>
              <input
                id="return-note"
                type="text"
                value={returnModal.note}
                onChange={(e) => setReturnModal((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Ví dụ: Đã kiểm tra đầy đủ, đèn pin bị trầy nhẹ..."
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            {returnModal.errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {returnModal.errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={returnModal.isSaving}
                onClick={() =>
                  setReturnModal({
                    open: false,
                    bookingId: null,
                    isSaving: false,
                    note: '',
                    items: {},
                    errorMessage: '',
                  })
                }
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={returnModal.isSaving}
                onClick={handleExecuteReturn}
                className="px-5 py-2.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {returnModal.isSaving ? 'Đang lưu...' : 'Xác nhận Thu hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideTripDetailPage;
