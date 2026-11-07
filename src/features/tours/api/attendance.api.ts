import { apiClient } from '../../../lib/axios';
import type {
  ParticipantCheckInRequest,
  ParticipantCheckInResponse,
  ParticipantCheckOutRequest,
  ParticipantCheckOutResponse,
  ScheduleManifestResponse,
  ScheduleGuideSummary,
  AssignGuidesRequest,
} from '../types/attendance.types';

const LOCAL_SCHEDULE_GUIDES_KEY = 'wetrek_schedule_guides_v1';
let cachedCatalogGuides: ScheduleGuideSummary[] = [];
let scheduleGuidesWriteMethodPromise: Promise<'post' | 'put' | 'none'> | null = null;

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

async function detectScheduleGuidesWriteMethod(): Promise<'post' | 'put' | 'none'> {
  if (!scheduleGuidesWriteMethodPromise) {
    scheduleGuidesWriteMethodPromise = apiClient
      .get<any>('/v3/api-docs', { skipAuth: true, skipAuthRefresh: true })
      .then((doc) => {
        const pathItem = doc?.paths?.['/api/v1/schedules/{scheduleId}/guides'];
        if (pathItem?.post) return 'post';
        if (pathItem?.put) return 'put';
        return 'none';
      })
      .catch(() => 'none');
  }
  return scheduleGuidesWriteMethodPromise;
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

      if (localGuides !== undefined) {
        return localGuides;
      }
      return normalizedRemote;
    } catch {
      return localGuides ?? [];
    }
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
    const writeMethod = await detectScheduleGuidesWriteMethod();

    if (writeMethod === 'post' || writeMethod === 'put') {
      try {
        const guides = await apiClient[writeMethod]<Array<ScheduleGuideSummary & { id?: number }>>(
          `/api/v1/schedules/${scheduleId}/guides`,
          payload,
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
        scheduleGuidesWriteMethodPromise = Promise.resolve('none');
      }
    }

    // Fallback lưu phân công phía client khi backend chỉ mới mở GET /api/v1/schedules/{scheduleId}/guides (tránh lỗi 405 Method Not Allowed)
    let guideDirectory = cachedCatalogGuides;
    if (guideDirectory.length === 0) {
      try {
        guideDirectory = await attendanceApi.listAllGuides(signal);
      } catch {
        guideDirectory = [];
      }
    }
    const existingAssigned = readLocalScheduleGuidesMap()[String(scheduleId)] || [];

    const assignedList: ScheduleGuideSummary[] = (payload.guides || []).map((item) => {
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
    const guides = await apiClient.get<Array<{
      id?: number;
      guideId?: number;
      accountId: number;
      fullName: string;
      email: string;
      phone?: string | null;
    }>>('/api/v1/admin/guides', { signal });
    const normalized = (guides || []).map((guide) => ({
      ...guide,
      guideId: (guide.guideId ?? guide.id) as number,
      isLead: false,
      assignedAt: null,
    }));
    cachedCatalogGuides = normalized;
    return normalized;
  },
};
