import { apiClient } from '../../../lib/axios';
import { equipmentApi } from '../../equipment/api/equipment.api';
import type {
  ParticipantCheckInRequest,
  ParticipantCheckInResponse,
  ParticipantCheckOutRequest,
  ParticipantCheckOutResponse,
  ScheduleManifestResponse,
  ScheduleGuideSummary,
  AssignGuidesRequest,
  HandoverPhotoRecord,
  ScheduleCheckInBatchReport,
  ScheduleCheckOutBatchReport,
  ScheduleOperationsReport,
  TimeWindowCheckResult,
} from '../types/attendance.types';

const LOCAL_SCHEDULE_GUIDES_KEY = 'wetrek_schedule_guides_v1';
export const LOCAL_SCHEDULE_OPERATIONS_REPORTS_KEY = 'wetrek_schedule_operations_reports_v1';

let cachedCatalogGuides: ScheduleGuideSummary[] = [];

export interface GuideIdentityInput {
  id?: number | string | null;
  email?: string | null;
  fullName?: string | null;
}

function readLocalScheduleGuidesMap(): Record<string, ScheduleGuideSummary[]> {
  try {
    const raw = localStorage.getItem(LOCAL_SCHEDULE_GUIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalScheduleGuides(scheduleId: number | string, guides: ScheduleGuideSummary[]): void {
  try {
    const map = readLocalScheduleGuidesMap();
    map[String(scheduleId)] = guides;
    localStorage.setItem(LOCAL_SCHEDULE_GUIDES_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

function readLocalOperationsReportsMap(): Record<string, ScheduleOperationsReport> {
  try {
    const raw = localStorage.getItem(LOCAL_SCHEDULE_OPERATIONS_REPORTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalOperationsReport(
  scheduleId: number | string,
  updater: (prev: ScheduleOperationsReport | undefined) => ScheduleOperationsReport
): ScheduleOperationsReport {
  const key = String(scheduleId);
  const map = readLocalOperationsReportsMap();
  const next = updater(map[key]);
  map[key] = next;
  try {
    localStorage.setItem(LOCAL_SCHEDULE_OPERATIONS_REPORTS_KEY, JSON.stringify(map));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wetrek-operations-report-updated', {
          detail: { scheduleId: Number(scheduleId) },
        })
      );
    }
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

// ============================================================================
// VIETNAM TIMEZONE (Asia/Ho_Chi_Minh) & TIME WINDOW HELPERS
// ============================================================================

export function formatVietnamDateTime(
  dateInput: string | Date | null | undefined,
  includeSeconds = false
): string {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  }).format(date);
}

export function formatVietnamDateOnly(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatVietnamTimeOnly(
  dateInput: string | Date | null | undefined,
  includeSeconds = false
): string {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: false,
  }).format(date);
}

export function formatRemainingDurationVi(remainingMs: number): string {
  if (remainingMs <= 0) return '0 phút';
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} phút`);
  return parts.join(' ');
}

/**
 * Kiểm tra khung giờ mở check-in:
 * Chỉ cho phép bắt đầu và xác nhận check-in từ đúng 1 giờ trước giờ khởi hành (startsAt).
 */
export function evaluateCheckInTimeWindow(
  startsAt: string,
  nowMs: number = Date.now()
): TimeWindowCheckResult {
  const startsAtMs = new Date(startsAt).getTime();
  if (Number.isNaN(startsAtMs)) {
    return {
      allowed: false,
      unlockAtIso: startsAt,
      referenceAtIso: startsAt,
      remainingMs: 0,
      message: 'Thời gian khởi hành của lịch không hợp lệ.',
    };
  }

  const unlockAtMs = startsAtMs - 60 * 60 * 1000; // Đúng 1 giờ trước startsAt
  const unlockAtIso = new Date(unlockAtMs).toISOString();
  const remainingMs = Math.max(0, unlockAtMs - nowMs);
  const allowed = nowMs >= unlockAtMs;

  if (!allowed) {
    return {
      allowed: false,
      unlockAtIso,
      referenceAtIso: startsAt,
      remainingMs,
      message: `Chưa đến khung giờ check-in. Chỉ được mở và xác nhận check-in từ ${formatVietnamDateTime(
        unlockAtIso
      )} (giờ Việt Nam — đúng 1 giờ trước giờ khởi hành ${formatVietnamDateTime(
        startsAt
      )}). Còn ${formatRemainingDurationVi(remainingMs)}.`,
    };
  }

  return {
    allowed: true,
    unlockAtIso,
    referenceAtIso: startsAt,
    remainingMs: 0,
    message: `Đã trong khung giờ cho phép check-in (mở từ ${formatVietnamDateTime(
      unlockAtIso
    )} giờ Việt Nam).`,
  };
}

/**
 * Kiểm tra khung giờ mở check-out:
 * Chỉ cho phép check-out khi chuyến đã đến giờ kết thúc (endsAt).
 */
export function evaluateCheckOutTimeWindow(
  endsAt: string,
  nowMs: number = Date.now()
): TimeWindowCheckResult {
  const endsAtMs = new Date(endsAt).getTime();
  if (Number.isNaN(endsAtMs)) {
    return {
      allowed: false,
      unlockAtIso: endsAt,
      referenceAtIso: endsAt,
      remainingMs: 0,
      message: 'Thời gian kết thúc của lịch không hợp lệ.',
    };
  }

  const unlockAtIso = new Date(endsAtMs).toISOString();
  const remainingMs = Math.max(0, endsAtMs - nowMs);
  const allowed = nowMs >= endsAtMs;

  if (!allowed) {
    return {
      allowed: false,
      unlockAtIso,
      referenceAtIso: endsAt,
      remainingMs,
      message: `Chưa đến giờ kết thúc chuyến. Chỉ được thực hiện và xác nhận check-out từ ${formatVietnamDateTime(
        unlockAtIso
      )} (giờ Việt Nam). Còn ${formatRemainingDurationVi(remainingMs)}.`,
    };
  }

  return {
    allowed: true,
    unlockAtIso,
    referenceAtIso: endsAt,
    remainingMs: 0,
    message: `Chuyến đã đến giờ kết thúc (${formatVietnamDateTime(
      unlockAtIso
    )} giờ Việt Nam). Có thể thực hiện check-out.`,
  };
}

// ============================================================================
// GUIDE IDENTITY & ASSIGNMENT HELPERS
// ============================================================================

export function matchGuideIdentity(
  guide: ScheduleGuideSummary,
  identity: GuideIdentityInput | null | undefined
): boolean {
  if (!identity) return false;

  if (identity.id !== undefined && identity.id !== null && String(identity.id).trim() !== '') {
    const targetId = Number(identity.id);
    if (!Number.isNaN(targetId)) {
      if (
        (guide.accountId !== undefined && Number(guide.accountId) === targetId) ||
        (guide.guideId !== undefined && Number(guide.guideId) === targetId) ||
        (guide.id !== undefined && Number(guide.id) === targetId)
      ) {
        return true;
      }
    }
  }

  if (identity.email && guide.email) {
    if (guide.email.trim().toLowerCase() === identity.email.trim().toLowerCase()) {
      return true;
    }
  }

  if (identity.fullName && guide.fullName) {
    if (guide.fullName.trim().toLowerCase() === identity.fullName.trim().toLowerCase()) {
      return true;
    }
  }

  return false;
}

/**
 * Nén và lưu trữ ảnh hiện trạng thiết bị lúc bàn giao / nhận lại.
 * Tận dụng endpoint upload của backend nếu có, đồng thời lưu khóa lưu trữ (storageKey) và dữ liệu ảnh đã nén.
 */
export async function prepareHandoverPhoto(
  file: File,
  scheduleId: number | string,
  stage: 'checkin' | 'checkout',
  participantId: number | string,
  equipmentId: number | string
): Promise<HandoverPhotoRecord> {
  const capturedAt = new Date().toISOString();
  const safeName = (file.name || 'equipment.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storageKey = `schedules/${scheduleId}/handover/${stage}/p${participantId}-eq${equipmentId}/${uniqueId}-${safeName}`;

  const dataUrl = await compressImageFile(file, 1100, 0.76);

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('stage', stage);
    formData.append('participantId', String(participantId));
    formData.append('equipmentId', String(equipmentId));
    formData.append('storageKey', storageKey);
    const uploaded = await apiClient.post<any>(
      `/api/v1/schedules/${scheduleId}/handover-photos`,
      formData
    );
    if (uploaded?.url || uploaded?.fileUrl) {
      return {
        id: uploaded.id || uniqueId,
        url: uploaded.url || uploaded.fileUrl,
        storageKey: uploaded.storageKey || uploaded.key || storageKey,
        fileName: uploaded.fileName || file.name || safeName,
        capturedAt: uploaded.capturedAt || capturedAt,
      };
    }
  } catch {
    // Fallback to persistent compressed storage record
  }

  return {
    id: uniqueId,
    url: dataUrl,
    storageKey,
    fileName: file.name || safeName,
    capturedAt,
  };
}

function compressImageFile(file: File, maxDimension = 1100, quality = 0.76): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));
    reader.onload = () => {
      const rawResult = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve(rawResult);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawResult);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed || rawResult);
        } catch {
          resolve(rawResult);
        }
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  });
}

export const attendanceApi = {
  /**
   * Điểm danh khách trước khi khởi hành chuyến.
   * POST /api/v1/schedules/{scheduleId}/bookings/{bookingId}/participants/{participantId}/check-in
   * Role: GUIDE (được phân công đúng lịch)
   */
  checkInParticipant: async (
    scheduleId: number | string,
    bookingId: number | string,
    participantId: number | string,
    payload: ParticipantCheckInRequest = {},
    signal?: AbortSignal
  ): Promise<ParticipantCheckInResponse> => {
    return apiClient.post<ParticipantCheckInResponse>(
      `/api/v1/schedules/${scheduleId}/bookings/${bookingId}/participants/${participantId}/check-in`,
      payload,
      { signal }
    );
  },

  /**
   * Ghi nhận check-out khách cuối hành trình.
   * POST /api/v1/schedules/{scheduleId}/bookings/{bookingId}/participants/{participantId}/check-out
   * Role: GUIDE (được phân công đúng lịch, khách đã check-in)
   */
  checkOutParticipant: async (
    scheduleId: number | string,
    bookingId: number | string,
    participantId: number | string,
    payload: ParticipantCheckOutRequest = {},
    signal?: AbortSignal
  ): Promise<ParticipantCheckOutResponse> => {
    return apiClient.post<ParticipantCheckOutResponse>(
      `/api/v1/schedules/${scheduleId}/bookings/${bookingId}/participants/${participantId}/check-out`,
      payload,
      { signal }
    );
  },

  /**
   * Lấy manifest tổng hợp hành khách và thiết bị theo lịch khởi hành.
   * GET /api/v1/schedules/{scheduleId}/manifest
   * (Đang chờ backend triển khai - trả về 404 nếu chưa có)
   */
  getScheduleManifest: async (
    scheduleId: number | string,
    signal?: AbortSignal
  ): Promise<ScheduleManifestResponse> => {
    return apiClient.get<ScheduleManifestResponse>(
      `/api/v1/schedules/${scheduleId}/manifest`,
      { signal }
    );
  },

  /**
   * Lấy danh sách guide được phân công theo lịch khởi hành.
   * GET /api/v1/schedules/{scheduleId}/guides
   */
  getAssignedGuides: async (
    scheduleId: number | string,
    signal?: AbortSignal
  ): Promise<ScheduleGuideSummary[]> => {
    const localMap = readLocalScheduleGuidesMap();
    const localGuides = localMap[String(scheduleId)];

    try {
      const guides = await apiClient.get<Array<ScheduleGuideSummary & { id?: number }>>(
        `/api/v1/schedules/${scheduleId}/guides`,
        { signal }
      );
      const normalizedRemote = (guides || []).map((guide) => ({
        ...guide,
        guideId: (guide.guideId ?? guide.id) as number,
      }));

      writeLocalScheduleGuides(scheduleId, normalizedRemote);
      return normalizedRemote;
    } catch {
      return localGuides ?? [];
    }
  },

  /**
   * Kiểm tra Guide hiện tại có được phân công vào lịch khởi hành này không.
   */
  verifyGuideAssignedToSchedule: async (
    scheduleId: number | string,
    identity: GuideIdentityInput | null | undefined,
    signal?: AbortSignal
  ): Promise<{
    assigned: boolean;
    guide: ScheduleGuideSummary | null;
    assignedGuides: ScheduleGuideSummary[];
  }> => {
    const assignedGuides = await attendanceApi.getAssignedGuides(scheduleId, signal);
    if (!identity || assignedGuides.length === 0) {
      return { assigned: false, guide: null, assignedGuides };
    }

    let matched = assignedGuides.find((g) => matchGuideIdentity(g, identity)) || null;

    if (!matched && cachedCatalogGuides.length > 0) {
      const catalogMatch = cachedCatalogGuides.find((cg) => matchGuideIdentity(cg, identity));
      if (catalogMatch) {
        matched =
          assignedGuides.find((ag) => Number(ag.guideId) === Number(catalogMatch.guideId)) || null;
      }
    }

    return {
      assigned: Boolean(matched),
      guide: matched,
      assignedGuides,
    };
  },

  /**
   * Phân công guide theo lịch khởi hành (Admin).
   * POST /api/v1/schedules/{scheduleId}/guides
   */
  assignGuidesToSchedule: async (
    scheduleId: number | string,
    payload: AssignGuidesRequest,
    signal?: AbortSignal
  ): Promise<ScheduleGuideSummary[]> => {
    // Chuẩn hóa danh sách phân công: loại trùng guideId và đảm bảo đúng 1 trưởng đoàn (isLead = true) khi danh sách không rỗng
    const seenGuideIds = new Set<number>();
    const dedupedGuides = (payload.guides || [])
      .filter((item) => {
        const gId = Number(item.guideId);
        if (!gId || seenGuideIds.has(gId)) return false;
        seenGuideIds.add(gId);
        return true;
      })
      .map((item) => ({
        guideId: Number(item.guideId),
        isLead: Boolean(item.isLead),
      }));

    if (dedupedGuides.length > 0) {
      const firstLeadIndex = dedupedGuides.findIndex((g) => g.isLead);
      const targetLeadIndex = firstLeadIndex >= 0 ? firstLeadIndex : 0;
      dedupedGuides.forEach((g, idx) => {
        g.isLead = idx === targetLeadIndex;
      });
    }

    const normalizedPayload: AssignGuidesRequest = {
      guides: dedupedGuides,
    };

    try {
      const guides = await apiClient.post<Array<ScheduleGuideSummary & { id?: number }>>(
        `/api/v1/schedules/${scheduleId}/guides`,
        normalizedPayload,
        { signal }
      );
      const normalized = (guides || []).map((guide) => ({
        ...guide,
        guideId: (guide.guideId ?? guide.id) as number,
      }));
      writeLocalScheduleGuides(scheduleId, normalized);
      return normalized;
    } catch (err: any) {
      if (err?.status !== 404 && err?.status !== 405 && err?.status !== 501) {
        throw err;
      }
    }

    let guideDirectory = cachedCatalogGuides;
    if (guideDirectory.length === 0) {
      try {
        guideDirectory = await attendanceApi.listAllGuides(signal);
      } catch {
        guideDirectory = [];
      }
    }
    const existingAssigned = readLocalScheduleGuidesMap()[String(scheduleId)] || [];

    const assignedList: ScheduleGuideSummary[] = dedupedGuides.map((item) => {
      const matched =
        guideDirectory.find((g) => g.guideId === item.guideId) ||
        existingAssigned.find((g) => g.guideId === item.guideId);
      return {
        guideId: item.guideId,
        accountId: matched?.accountId,
        fullName: matched?.fullName || `Hướng dẫn viên`,
        email: matched?.email ?? null,
        phone: matched?.phone ?? null,
        isLead: Boolean(item.isLead),
        assignedAt: matched?.assignedAt || new Date().toISOString(),
      };
    });

    writeLocalScheduleGuides(scheduleId, assignedList);
    return assignedList;
  },

  /**
   * Lấy danh sách toàn bộ Guide khả dụng trong hệ thống (dành cho Admin).
   * GET /api/v1/admin/guides
   */
  listAllGuides: async (signal?: AbortSignal): Promise<ScheduleGuideSummary[]> => {
    const guides = await apiClient.get<
      Array<{
        id?: number;
        guideId?: number;
        accountId: number;
        fullName: string;
        email: string;
        phone?: string | null;
      }>
    >('/api/v1/admin/guides', { signal });
    const normalized = (guides || []).map((guide) => ({
      ...guide,
      guideId: (guide.guideId ?? guide.id) as number,
      isLead: false,
      assignedAt: null,
    }));
    cachedCatalogGuides = normalized;
    return normalized;
  },

  // ============================================================================
  // BATCH CHECK-IN / CHECK-OUT & OPERATIONS REPORT API
  // ============================================================================

  /**
   * Lấy báo cáo tác nghiệp (bao gồm bản nháp đang nhập hoặc đã xác nhận) cho Guide.
   */
  getScheduleOperationsReport: async (
    scheduleId: number | string,
    signal?: AbortSignal
  ): Promise<ScheduleOperationsReport | null> => {
    const localMap = readLocalOperationsReportsMap();
    const localReport = localMap[String(scheduleId)] || null;

    try {
      const remote = await apiClient.get<ScheduleOperationsReport>(
        `/api/v1/schedules/${scheduleId}/operations-report`,
        { signal }
      );
      if (remote) {
        const mergedCheckIn =
          remote.checkInReport?.roundStatus === 'CONFIRMED'
            ? remote.checkInReport
            : localReport?.checkInReport ?? null;
        const mergedCheckOut =
          remote.checkOutReport?.roundStatus === 'CONFIRMED'
            ? remote.checkOutReport
            : localReport?.checkOutReport ?? null;

        const merged: ScheduleOperationsReport = {
          scheduleId: Number(remote.scheduleId || scheduleId),
          tourId: remote.tourId ?? localReport?.tourId,
          tourTitle: remote.tourTitle ?? localReport?.tourTitle,
          startsAt: remote.startsAt ?? localReport?.startsAt,
          endsAt: remote.endsAt ?? localReport?.endsAt,
          checkInReport: mergedCheckIn,
          checkOutReport: mergedCheckOut,
          updatedAt: remote.updatedAt || localReport?.updatedAt || new Date().toISOString(),
        };

        writeLocalOperationsReport(scheduleId, () => merged);
        return merged;
      }
    } catch {
      // Use local report when remote endpoint is unavailable
    }

    return localReport;
  },

  /**
   * Lấy báo cáo tác nghiệp ĐÃ XÁC NHẬN dành cho Admin giám sát.
   * Admin chỉ nhận được lượt check-in / check-out khi Guide đã bấm xác nhận hoàn tất (roundStatus === 'CONFIRMED').
   */
  getConfirmedScheduleOperationsReport: async (
    scheduleId: number | string,
    signal?: AbortSignal
  ): Promise<ScheduleOperationsReport | null> => {
    const fullReport = await attendanceApi.getScheduleOperationsReport(scheduleId, signal);
    if (!fullReport) return null;

    const confirmedCheckIn =
      fullReport.checkInReport?.roundStatus === 'CONFIRMED' ? fullReport.checkInReport : null;
    const confirmedCheckOut =
      fullReport.checkOutReport?.roundStatus === 'CONFIRMED' ? fullReport.checkOutReport : null;

    return {
      ...fullReport,
      checkInReport: confirmedCheckIn,
      checkOutReport: confirmedCheckOut,
    };
  },

  /**
   * Lưu tạm (draft) lượt check-in trong quá trình Guide đang nhập.
   * Không ghi đè nếu lượt check-in đã ở trạng thái CONFIRMED.
   */
  saveScheduleCheckInDraft: (
    scheduleId: number | string,
    draftReport: ScheduleCheckInBatchReport,
    meta?: { tourId?: number; tourTitle?: string; startsAt?: string; endsAt?: string }
  ): ScheduleOperationsReport => {
    return writeLocalOperationsReport(scheduleId, (prev) => {
      if (prev?.checkInReport?.roundStatus === 'CONFIRMED') {
        return prev;
      }
      return {
        scheduleId: Number(scheduleId),
        tourId: meta?.tourId ?? prev?.tourId,
        tourTitle: meta?.tourTitle ?? prev?.tourTitle,
        startsAt: meta?.startsAt ?? prev?.startsAt,
        endsAt: meta?.endsAt ?? prev?.endsAt,
        checkInReport: {
          ...draftReport,
          scheduleId: Number(scheduleId),
        },
        checkOutReport: prev?.checkOutReport ?? null,
        updatedAt: new Date().toISOString(),
      };
    });
  },

  /**
   * Lưu tạm (draft) lượt check-out trong quá trình Guide đang nhập.
   * Không ghi đè nếu lượt check-out đã ở trạng thái CONFIRMED.
   */
  saveScheduleCheckOutDraft: (
    scheduleId: number | string,
    draftReport: ScheduleCheckOutBatchReport,
    meta?: { tourId?: number; tourTitle?: string; startsAt?: string; endsAt?: string }
  ): ScheduleOperationsReport => {
    return writeLocalOperationsReport(scheduleId, (prev) => {
      if (prev?.checkOutReport?.roundStatus === 'CONFIRMED') {
        return prev;
      }
      return {
        scheduleId: Number(scheduleId),
        tourId: meta?.tourId ?? prev?.tourId,
        tourTitle: meta?.tourTitle ?? prev?.tourTitle,
        startsAt: meta?.startsAt ?? prev?.startsAt,
        endsAt: meta?.endsAt ?? prev?.endsAt,
        checkInReport: prev?.checkInReport ?? null,
        checkOutReport: {
          ...draftReport,
          scheduleId: Number(scheduleId),
        },
        updatedAt: new Date().toISOString(),
      };
    });
  },

  /**
   * Xác nhận hoàn tất toàn bộ lượt Check-in & bàn giao thiết bị cho lịch khởi hành.
   * Kiểm tra:
   * 1. Quyền Guide được phân công đúng lịch.
   * 2. Chặn xác nhận trùng lặp (409).
   * 3. Điều kiện khung giờ: now >= startsAt - 1 giờ (múi giờ Việt Nam).
   * 4. Toàn bộ khách trong danh sách đã được đánh dấu (PRESENT / ABSENT) và thiết bị hợp lệ.
   */
  submitScheduleCheckInBatch: async (params: {
    scheduleId: number;
    startsAt: string;
    endsAt?: string;
    tourId?: number;
    tourTitle?: string;
    report: ScheduleCheckInBatchReport;
    bookingOrderedEquipmentMap?: Record<number, Record<number, { orderedQuantity: number; equipmentName: string }>>;
    guideIdentity: GuideIdentityInput | null | undefined;
    signal?: AbortSignal;
  }): Promise<ScheduleCheckInBatchReport> => {
    const {
      scheduleId,
      startsAt,
      endsAt,
      tourId,
      tourTitle,
      report,
      bookingOrderedEquipmentMap,
      guideIdentity,
      signal,
    } = params;

    const persistFailedState = (message: string) => {
      writeLocalOperationsReport(scheduleId, (prev) => {
        if (prev?.checkInReport?.roundStatus === 'CONFIRMED') return prev;
        return {
          scheduleId,
          tourId: tourId ?? prev?.tourId,
          tourTitle: tourTitle ?? prev?.tourTitle,
          startsAt: startsAt ?? prev?.startsAt,
          endsAt: endsAt ?? prev?.endsAt,
          checkInReport: {
            ...report,
            scheduleId,
            roundStatus: 'FAILED',
            lastErrorMessage: message,
          },
          checkOutReport: prev?.checkOutReport ?? null,
          updatedAt: new Date().toISOString(),
        };
      });
    };

    // 1. Kiểm tra quyền Guide được phân công
    const permission = await attendanceApi.verifyGuideAssignedToSchedule(
      scheduleId,
      guideIdentity,
      signal
    );
    if (!permission.assigned) {
      const msg =
        'Truy cập bị từ chối: Bạn không nằm trong danh sách Guide được phân công phụ trách lịch khởi hành này.';
      persistFailedState(msg);
      throw { status: 403, message: msg };
    }

    // 2. Chặn gửi trùng nếu lượt đã xác nhận
    const existing = await attendanceApi.getScheduleOperationsReport(scheduleId, signal);
    if (existing?.checkInReport?.roundStatus === 'CONFIRMED') {
      throw {
        status: 409,
        message: 'Lượt check-in của lịch khởi hành này đã được xác nhận hoàn tất trước đó.',
      };
    }

    // 3. Kiểm tra khung giờ hợp lệ (từ đúng 1 giờ trước startsAt)
    const timeCheck = evaluateCheckInTimeWindow(startsAt, Date.now());
    if (!timeCheck.allowed) {
      persistFailedState(timeCheck.message);
      throw { status: 400, message: timeCheck.message };
    }

    // 4. Kiểm tra toàn bộ danh sách khách đã được xử lý
    if (!report.participants || report.participants.length === 0) {
      const msg = 'Danh sách hành khách trống, không thể xác nhận lượt check-in.';
      persistFailedState(msg);
      throw { status: 400, message: msg };
    }

    const pendingGuests = report.participants.filter((p) => p.status === 'PENDING');
    if (pendingGuests.length > 0) {
      const names = pendingGuests.map((p) => p.fullName).join(', ');
      const msg = `Còn ${pendingGuests.length} hành khách chưa được đánh dấu Có mặt / Vắng mặt: ${names}.`;
      persistFailedState(msg);
      throw { status: 400, message: msg };
    }

    // 5. Kiểm tra phân bổ thiết bị không vượt số lượng đặt của từng booking và ghi chú khi hỏng/thiếu
    const allocatedByBooking: Record<number, Record<number, number>> = {};
    for (const participant of report.participants) {
      for (const eq of participant.equipmentItems || []) {
        if (eq.allocatedQuantity < 0) {
          const msg = `Số lượng thiết bị "${eq.equipmentName}" bàn giao cho khách ${participant.fullName} không hợp lệ.`;
          persistFailedState(msg);
          throw { status: 400, message: msg };
        }
        if (eq.allocatedQuantity > 0) {
          if (
            (eq.condition === 'DAMAGED' || eq.condition === 'MISSING') &&
            (!eq.note || !eq.note.trim())
          ) {
            const msg = `Vui lòng nhập ghi chú tình trạng cho thiết bị "${eq.equipmentName}" của khách ${participant.fullName} (đang chọn Hỏng/Thiếu).`;
            persistFailedState(msg);
            throw { status: 400, message: msg };
          }
          if (!allocatedByBooking[participant.bookingId]) {
            allocatedByBooking[participant.bookingId] = {};
          }
          allocatedByBooking[participant.bookingId][eq.equipmentId] =
            (allocatedByBooking[participant.bookingId][eq.equipmentId] || 0) +
            eq.allocatedQuantity;
        }
      }
    }

    if (bookingOrderedEquipmentMap) {
      for (const [bIdStr, eqMap] of Object.entries(bookingOrderedEquipmentMap)) {
        const bId = Number(bIdStr);
        for (const [eqIdStr, metaInfo] of Object.entries(eqMap)) {
          const eqId = Number(eqIdStr);
          const totalAllocated = allocatedByBooking[bId]?.[eqId] || 0;
          if (totalAllocated > metaInfo.orderedQuantity) {
            const msg = `Đơn #${bId}: Tổng số lượng bàn giao của "${metaInfo.equipmentName}" (${totalAllocated}) vượt quá số lượng đơn đặt (${metaInfo.orderedQuantity}).`;
            persistFailedState(msg);
            throw { status: 400, message: msg };
          }
        }
      }
    }

    const submittedAt = new Date().toISOString();
    const normalizedParticipants = report.participants.map((p) => ({
      ...p,
      markedAt: p.markedAt || submittedAt,
      equipmentItems: (p.equipmentItems || [])
        .filter((item) => item.allocatedQuantity > 0)
        .map((item) => ({
          ...item,
          handedOverAt: item.handedOverAt || submittedAt,
        })),
    }));

    const confirmedReport: ScheduleCheckInBatchReport = {
      ...report,
      scheduleId,
      roundStatus: 'CONFIRMED',
      startedAt: report.startedAt || submittedAt,
      submittedAt,
      submittedByGuideId:
        permission.guide?.guideId ??
        (guideIdentity?.id ? Number(guideIdentity.id) : null),
      submittedByGuideName:
        permission.guide?.fullName || guideIdentity?.fullName || 'Hướng dẫn viên',
      submittedByGuideEmail:
        permission.guide?.email || guideIdentity?.email || null,
      lastErrorMessage: null,
      participants: normalizedParticipants,
    };

    let finalConfirmedReport: ScheduleCheckInBatchReport = confirmedReport;

    try {
      const requestBody = {
        idempotencyKey:
          confirmedReport.idempotencyKey || `checkin-${scheduleId}-${Date.now()}`,
        startedAt: confirmedReport.startedAt || submittedAt,
        generalNote: confirmedReport.generalNote || null,
        participants: normalizedParticipants.map((p) => ({
          bookingId: p.bookingId,
          participantId: p.participantId,
          status: p.status,
          markedAt: p.markedAt || submittedAt,
          note: p.note || null,
          equipmentItems: (p.equipmentItems || []).map((eq) => ({
            equipmentId: eq.equipmentId,
            equipmentName: eq.equipmentName,
            allocatedQuantity: eq.allocatedQuantity,
            condition: eq.condition || 'GOOD',
            note: eq.note || null,
            handedOverAt: eq.handedOverAt || submittedAt,
            photos: (eq.photos || []).map((ph) => ({
              id: ph.id,
              url: ph.url,
              storageKey: ph.storageKey,
              fileName: ph.fileName,
              capturedAt: ph.capturedAt || submittedAt,
            })),
          })),
        })),
      };

      const remoteConfirmed = await apiClient.post<ScheduleCheckInBatchReport>(
        `/api/v1/schedules/${scheduleId}/check-in-batch`,
        requestBody,
        { signal }
      );
      if (remoteConfirmed && remoteConfirmed.roundStatus === 'CONFIRMED') {
        finalConfirmedReport = {
          ...confirmedReport,
          ...remoteConfirmed,
          participants:
            Array.isArray(remoteConfirmed.participants) &&
            remoteConfirmed.participants.length > 0
              ? remoteConfirmed.participants
              : confirmedReport.participants,
        };
      }
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 501) {
        // Fallback cho backend cũ chưa có batch endpoint
        await Promise.allSettled(
          normalizedParticipants
            .filter((p) => p.status === 'PRESENT')
            .map((p) =>
              attendanceApi.checkInParticipant(
                scheduleId,
                p.bookingId,
                p.participantId,
                { note: p.note || undefined },
                signal
              )
            )
        );

        await Promise.allSettled(
          Object.entries(allocatedByBooking).map(([bIdStr, eqTotals]) => {
            const items = Object.entries(eqTotals)
              .filter(([, qty]) => qty > 0)
              .map(([eqIdStr, qty]) => ({
                equipmentId: Number(eqIdStr),
                quantity: qty,
              }));
            if (items.length === 0) return Promise.resolve();
            return equipmentApi.issueBookingEquipment(
              Number(bIdStr),
              { items },
              signal
            );
          })
        );
      } else {
        const message =
          err?.message || 'Gửi kết quả check-in lên máy chủ thất bại. Vui lòng thử lại.';
        persistFailedState(message);
        throw err;
      }
    }

    writeLocalOperationsReport(scheduleId, (prev) => ({
      scheduleId,
      tourId: tourId ?? prev?.tourId,
      tourTitle: tourTitle ?? prev?.tourTitle,
      startsAt: startsAt ?? prev?.startsAt,
      endsAt: endsAt ?? prev?.endsAt,
      checkInReport: finalConfirmedReport,
      checkOutReport: prev?.checkOutReport ?? null,
      updatedAt: finalConfirmedReport.submittedAt || submittedAt,
    }));

    return finalConfirmedReport;
  },

  /**
   * Xác nhận hoàn tất toàn bộ lượt Check-out & nhận lại thiết bị cuối hành trình.
   * Kiểm tra:
   * 1. Quyền Guide được phân công đúng lịch.
   * 2. Lượt Check-in đã được xác nhận trước đó.
   * 3. Chặn gửi trùng lặp (409).
   * 4. Điều kiện khung giờ: now >= endsAt (múi giờ Việt Nam).
   * 5. Đối chiếu số lượng nhận lại (0 <= returnedQuantity <= issuedQuantity) và bắt buộc ghi chú nếu thiết bị thiếu/hỏng.
   */
  submitScheduleCheckOutBatch: async (params: {
    scheduleId: number;
    startsAt?: string;
    endsAt: string;
    tourId?: number;
    tourTitle?: string;
    report: ScheduleCheckOutBatchReport;
    guideIdentity: GuideIdentityInput | null | undefined;
    signal?: AbortSignal;
  }): Promise<ScheduleCheckOutBatchReport> => {
    const {
      scheduleId,
      startsAt,
      endsAt,
      tourId,
      tourTitle,
      report,
      guideIdentity,
      signal,
    } = params;

    const persistFailedState = (message: string) => {
      writeLocalOperationsReport(scheduleId, (prev) => {
        if (prev?.checkOutReport?.roundStatus === 'CONFIRMED') return prev;
        return {
          scheduleId,
          tourId: tourId ?? prev?.tourId,
          tourTitle: tourTitle ?? prev?.tourTitle,
          startsAt: startsAt ?? prev?.startsAt,
          endsAt: endsAt ?? prev?.endsAt,
          checkInReport: prev?.checkInReport ?? null,
          checkOutReport: {
            ...report,
            scheduleId,
            roundStatus: 'FAILED',
            lastErrorMessage: message,
          },
          updatedAt: new Date().toISOString(),
        };
      });
    };

    // 1. Kiểm tra quyền Guide được phân công
    const permission = await attendanceApi.verifyGuideAssignedToSchedule(
      scheduleId,
      guideIdentity,
      signal
    );
    if (!permission.assigned) {
      const msg =
        'Truy cập bị từ chối: Bạn không nằm trong danh sách Guide được phân công phụ trách lịch khởi hành này.';
      persistFailedState(msg);
      throw { status: 403, message: msg };
    }

    // 2. Kiểm tra lượt Check-in đã xác nhận và chặn gửi trùng Check-out
    const existing = await attendanceApi.getScheduleOperationsReport(scheduleId, signal);
    if (existing?.checkInReport?.roundStatus !== 'CONFIRMED') {
      const msg =
        'Bạn cần hoàn tất và xác nhận lượt Check-in trước khi thực hiện xác nhận lượt Check-out.';
      persistFailedState(msg);
      throw { status: 400, message: msg };
    }
    if (existing?.checkOutReport?.roundStatus === 'CONFIRMED') {
      throw {
        status: 409,
        message: 'Lượt check-out của lịch khởi hành này đã được xác nhận hoàn tất trước đó.',
      };
    }

    // 3. Kiểm tra khung giờ hợp lệ (chỉ cho phép khi đã đến endsAt)
    const timeCheck = evaluateCheckOutTimeWindow(endsAt, Date.now());
    if (!timeCheck.allowed) {
      persistFailedState(timeCheck.message);
      throw { status: 400, message: timeCheck.message };
    }

    // 4. Kiểm tra toàn bộ danh sách khách đã được ghi nhận trạng thái kết thúc chuyến
    if (!report.participants || report.participants.length === 0) {
      const msg = 'Danh sách hành khách trống, không thể xác nhận lượt check-out.';
      persistFailedState(msg);
      throw { status: 400, message: msg };
    }

    const pendingGuests = report.participants.filter((p) => p.status === 'PENDING');
    if (pendingGuests.length > 0) {
      const names = pendingGuests.map((p) => p.fullName).join(', ');
      const msg = `Còn ${pendingGuests.length} hành khách chưa được ghi nhận trạng thái kết thúc chuyến: ${names}.`;
      persistFailedState(msg);
      throw { status: 400, message: msg };
    }

    // 5. Đối chiếu thiết bị nhận lại với số lượng đã bàn giao
    const returnedByBooking: Record<
      number,
      Record<number, { quantity: number; conditionOnReturn: string; damageNotes: string[] }>
    > = {};

    for (const participant of report.participants) {
      for (const eq of participant.equipmentItems || []) {
        if (eq.returnedQuantity < 0) {
          const msg = `Số lượng nhận lại của thiết bị "${eq.equipmentName}" (khách ${participant.fullName}) không được âm.`;
          persistFailedState(msg);
          throw { status: 400, message: msg };
        }
        if (eq.returnedQuantity > eq.issuedQuantity) {
          const msg = `Thiết bị "${eq.equipmentName}" của khách ${participant.fullName}: Số lượng nhận lại (${eq.returnedQuantity}) không được vượt quá số lượng đã bàn giao lúc check-in (${eq.issuedQuantity}).`;
          persistFailedState(msg);
          throw { status: 400, message: msg };
        }

        const isShortage = eq.returnedQuantity < eq.issuedQuantity;
        const isIssueCondition =
          eq.condition === 'DAMAGED' ||
          eq.condition === 'MISSING' ||
          eq.condition === 'NEEDS_INSPECTION';

        if ((isShortage || isIssueCondition) && (!eq.note || !eq.note.trim())) {
          const reason = isShortage
            ? `chưa trả đủ (${eq.returnedQuantity}/${eq.issuedQuantity})`
            : `tình trạng ${eq.condition}`;
          const msg = `Vui lòng ghi chú rõ tình trạng cho thiết bị "${eq.equipmentName}" của khách ${participant.fullName} do ${reason}.`;
          persistFailedState(msg);
          throw { status: 400, message: msg };
        }

        if (!returnedByBooking[participant.bookingId]) {
          returnedByBooking[participant.bookingId] = {};
        }
        if (!returnedByBooking[participant.bookingId][eq.equipmentId]) {
          returnedByBooking[participant.bookingId][eq.equipmentId] = {
            quantity: 0,
            conditionOnReturn: 'GOOD',
            damageNotes: [],
          };
        }
        const agg = returnedByBooking[participant.bookingId][eq.equipmentId];
        agg.quantity += eq.returnedQuantity;
        if (eq.condition === 'DAMAGED' || eq.condition === 'MISSING' || isShortage) {
          agg.conditionOnReturn = 'DAMAGED';
        } else if (
          eq.condition === 'NEEDS_INSPECTION' &&
          agg.conditionOnReturn !== 'DAMAGED'
        ) {
          agg.conditionOnReturn = 'NEEDS_INSPECTION';
        }
        if (eq.note && eq.note.trim()) {
          agg.damageNotes.push(`${participant.fullName}: ${eq.note.trim()}`);
        }
      }
    }

    const submittedAt = new Date().toISOString();
    const normalizedParticipants = report.participants.map((p) => ({
      ...p,
      markedAt: p.markedAt || submittedAt,
      equipmentItems: (p.equipmentItems || []).map((item) => ({
        ...item,
        returnedAt: item.returnedAt || submittedAt,
      })),
    }));

    const confirmedReport: ScheduleCheckOutBatchReport = {
      ...report,
      scheduleId,
      roundStatus: 'CONFIRMED',
      startedAt: report.startedAt || submittedAt,
      submittedAt,
      submittedByGuideId:
        permission.guide?.guideId ??
        (guideIdentity?.id ? Number(guideIdentity.id) : null),
      submittedByGuideName:
        permission.guide?.fullName || guideIdentity?.fullName || 'Hướng dẫn viên',
      submittedByGuideEmail:
        permission.guide?.email || guideIdentity?.email || null,
      lastErrorMessage: null,
      participants: normalizedParticipants,
    };

    let finalConfirmedReport: ScheduleCheckOutBatchReport = confirmedReport;

    try {
      const requestBody = {
        idempotencyKey:
          confirmedReport.idempotencyKey || `checkout-${scheduleId}-${Date.now()}`,
        startedAt: confirmedReport.startedAt || submittedAt,
        generalNote: confirmedReport.generalNote || null,
        participants: normalizedParticipants.map((p) => ({
          bookingId: p.bookingId,
          participantId: p.participantId,
          status: p.status,
          markedAt: p.markedAt || submittedAt,
          note: p.note || null,
          equipmentItems: (p.equipmentItems || []).map((eq) => ({
            equipmentId: eq.equipmentId,
            equipmentName: eq.equipmentName,
            issuedQuantity: eq.issuedQuantity,
            returnedQuantity: eq.returnedQuantity,
            condition: eq.condition || 'GOOD',
            note: eq.note || null,
            returnedAt: eq.returnedAt || submittedAt,
            photos: (eq.photos || []).map((ph) => ({
              id: ph.id,
              url: ph.url,
              storageKey: ph.storageKey,
              fileName: ph.fileName,
              capturedAt: ph.capturedAt || submittedAt,
            })),
          })),
        })),
      };

      const remoteConfirmed = await apiClient.post<ScheduleCheckOutBatchReport>(
        `/api/v1/schedules/${scheduleId}/check-out-batch`,
        requestBody,
        { signal }
      );
      if (remoteConfirmed && remoteConfirmed.roundStatus === 'CONFIRMED') {
        finalConfirmedReport = {
          ...confirmedReport,
          ...remoteConfirmed,
          participants:
            Array.isArray(remoteConfirmed.participants) &&
            remoteConfirmed.participants.length > 0
              ? remoteConfirmed.participants
              : confirmedReport.participants,
        };
      }
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 501) {
        await Promise.allSettled(
          normalizedParticipants
            .filter((p) => p.status !== 'ABSENT_AT_CHECKIN')
            .map((p) =>
              attendanceApi.checkOutParticipant(
                scheduleId,
                p.bookingId,
                p.participantId,
                { note: p.note || undefined },
                signal
              )
            )
        );

        await Promise.allSettled(
          Object.entries(returnedByBooking).map(([bIdStr, eqMap]) => {
            const items = Object.entries(eqMap)
              .filter(([, info]) => info.quantity > 0)
              .map(([eqIdStr, info]) => ({
                equipmentId: Number(eqIdStr),
                quantity: info.quantity,
                conditionOnReturn: info.conditionOnReturn,
                damageNote: info.damageNotes.join(' | ') || undefined,
              }));
            if (items.length === 0) return Promise.resolve();
            return equipmentApi.returnBookingEquipment(
              Number(bIdStr),
              { items },
              signal
            );
          })
        );
      } else {
        const message =
          err?.message || 'Gửi kết quả check-out lên máy chủ thất bại. Vui lòng thử lại.';
        persistFailedState(message);
        throw err;
      }
    }

    writeLocalOperationsReport(scheduleId, (prev) => ({
      scheduleId,
      tourId: tourId ?? prev?.tourId,
      tourTitle: tourTitle ?? prev?.tourTitle,
      startsAt: startsAt ?? prev?.startsAt,
      endsAt: endsAt ?? prev?.endsAt,
      checkInReport: prev?.checkInReport ?? null,
      checkOutReport: finalConfirmedReport,
      updatedAt: finalConfirmedReport.submittedAt || submittedAt,
    }));

    return finalConfirmedReport;
  },
};
