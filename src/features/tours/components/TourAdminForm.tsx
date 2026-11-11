import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Mountain,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Link2,
  Award,
  Loader2,
  Activity,
  Users,
  DollarSign,
  Phone,
  MapPin,
  Clock,
  ShieldAlert,
  Compass,
  CheckCircle,
  Circle,
  AlertTriangle,
} from 'lucide-react';
import {
  DifficultyLevel,
  TourStatus,
  CreateTourRequest,
  UpdateTourRequest,
  TourDetailResponse,
  DIFFICULTY_OPTIONS,
  TOUR_STATUS_OPTIONS,
} from '../types/tour.types';
import { LargeDateTimePicker, displayLocalDateTime } from './LargeDateTimePicker';
import { TourMediaPicker, SelectedPhoto } from './TourMediaPicker';
import { TourItineraryDraftEditor } from './TourItineraryDraftEditor';
import { TourEquipmentEditor } from './TourEquipmentEditor';
import type { ItineraryDraft } from './TourItineraryDraftEditor';
import { toursApi } from '../api/tours.api';
import { apiClient } from '../../../lib/axios';
import type { ApiError } from '../../../types/api.types';
import {
  formatOffsetDateTime,
  calculateEndsAt,
  defaultBalanceDueAt,
  formatVND,
} from '../../../lib/utils';
import { ROUTES } from '../../../constants/routes';
import { navigateTo } from '../../../lib/navigation';
import { toast } from '../../../components/ui/Toast';

export interface TourAdminFormProps {
  mode: 'create' | 'edit';
  initialData?: TourDetailResponse | null;
  onCancel: () => void;
}

export const TourAdminForm: React.FC<TourAdminFormProps> = ({
  mode,
  initialData,
  onCancel,
}) => {
  // Tour base fields
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialData?.difficulty || 'MODERATE'
  );
  const [durationDays, setDurationDays] = useState<string>(
    initialData?.durationDays ? String(initialData.durationDays) : '2'
  );
  const [requiredExperience, setRequiredExperience] = useState<string>(
    initialData?.requiredExperience || ''
  );
  const [includedServices, setIncludedServices] = useState<string>(
    initialData?.includedServices || ''
  );
  const [excludedServices, setExcludedServices] = useState<string>(
    initialData?.excludedServices || ''
  );
  const [routeFileUrl, setRouteFileUrl] = useState<string>(
    initialData?.routeFileUrl || ''
  );
  // Status choice: DRAFT or PUBLISHED (in create mode default to DRAFT)
  const [tourStatus, setTourStatus] = useState<TourStatus>(
    initialData?.status || 'DRAFT'
  );

  const [termsOptions, setTermsOptions] = useState<Array<{id:number; title:string; versionNumber:number; kind:string}>>([]);
  const [selectedTerms, setSelectedTerms] = useState<number[]>([]);
  const [activeSection, setActiveSection] = useState('tour-basic');
  const [termsSaved, setTermsSaved] = useState(false);
  const [existingTerms, setExistingTerms] = useState<Array<{versionId:number; title:string; versionNumber:number; primaryCancellation:boolean}>>([]);
  const [existingTermsError, setExistingTermsError] = useState(false);
  const [existingTermsLoading, setExistingTermsLoading] = useState(mode === 'edit');
  useEffect(() => { if (mode !== 'edit' || !initialData?.id) return; let active = true; setExistingTermsLoading(true); apiClient.get<Array<{versionId:number;title:string;versionNumber:number;primaryCancellation:boolean}>>(`/api/v1/tours/${initialData.id}/terms`).then(items => { if (active) { setExistingTerms(items); setSelectedTerms(items.filter(t => !t.primaryCancellation).map(t => t.versionId)); setExistingTermsError(false); } }).catch(() => { if (active) setExistingTermsError(true); }).finally(() => { if (active) setExistingTermsLoading(false); }); return () => { active = false; }; }, [mode, initialData?.id]);
  const [termsError, setTermsError] = useState('');
  const loadTerms = () => { setTermsError(''); apiClient.get<Array<{id:number;title:string;versionNumber:number;kind:string}>>('/api/v1/admin/policies/available').then(items => setTermsOptions(items)).catch(() => setTermsError('Không tải được điều khoản.')); };
  useEffect(() => { loadTerms(); }, []);
  const [policyId, setPolicyId] = useState<string>(initialData?.cancellationPolicyVersionId ? String(initialData.cancellationPolicyVersionId) : '');

  // Initial Departure Schedule fields (required when creating tour)
  const [dateKnown, setDateKnown] = useState(false);
  const [startsAt, setStartsAt] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('');
  const [basePriceVnd, setBasePriceVnd] = useState<string>('');
  const [equipmentFeeVnd, setEquipmentFeeVnd] = useState<string>('0');
  const [depositPercent, setDepositPercent] = useState<string>('30');
  const [balanceDueAt, setBalanceDueAt] = useState<string>('');
  const [dueEdited, setDueEdited] = useState(false);
  const [meetingPoint, setMeetingPoint] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');

  const [itineraryDays, setItineraryDays] = useState<ItineraryDraft[]>([]);
  const [itinerarySaved, setItinerarySaved] = useState(false);

  // Selected tour photos
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);

  // Multi-step lifecycle state
  const [createdTourId, setCreatedTourId] = useState<number | null>(
    initialData?.id || null
  );
  const [createdScheduleId, setCreatedScheduleId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<
    'idle' | 'creating_tour' | 'creating_schedule' | 'saving_itinerary' | 'saving_terms' | 'uploading_media' | 'publishing' | 'done'
  >('idle');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Validation & Step errors
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<{
    step: 'tour' | 'schedule' | 'itinerary' | 'terms' | 'media' | 'publish';
    title?: string;
    message: string;
    guidance?: string;
  } | null>(null);

  // Auto-calculated endsAt based on startsAt + durationDays
  const endsAt = useMemo(() => {
    return calculateEndsAt(startsAt, Number(durationDays));
  }, [startsAt, durationDays]);

  const editorSections = [
    { id: 'tour-basic', label: 'Thông tin tour', ready: Boolean(title.trim()) && Number(durationDays) > 0, optional: false },
    { id: 'tour-terms', label: 'Điều khoản', ready: Boolean(policyId) && !existingTermsLoading && !existingTermsError, optional: false },
    { id: 'tour-equipment', label: 'Thiết bị', ready: false, optional: true },
    { id: 'tour-preparation', label: 'Chuẩn bị', ready: Boolean(requiredExperience.trim() || includedServices.trim() || excludedServices.trim() || routeFileUrl.trim()), optional: true },
    { id: 'tour-media', label: 'Hình ảnh', ready: Boolean(initialData?.media?.length || selectedPhotos.length), optional: true },
    ...(mode === 'create' ? [
      { id: 'tour-itinerary', label: 'Lịch trình', ready: itineraryDays.length > 0, optional: true },
      { id: 'tour-departure', label: 'Khởi hành', ready: Boolean(createdScheduleId), optional: true },
    ] : []),
  ].filter((section) => section.id !== 'tour-equipment' || (mode === 'edit' && Boolean(initialData?.id)));
  const readySections = editorSections.filter((section) => section.ready).length;
  const activeSectionIndex = Math.max(0, editorSections.findIndex((section) => section.id === activeSection));
  const sectionForTarget = (target: string) => {
    if (target.includes('terms') || target.includes('policy')) return 'tour-terms';
    if (target.includes('equipment')) return 'tour-equipment';
    if (target.includes('itinerary')) return 'tour-itinerary';
    if (target.includes('media')) return 'tour-media';
    if (target.includes('preparation') || target.includes('routeFile')) return 'tour-preparation';
    if (target.includes('departure') || target.includes('schedule')) return 'tour-departure';
    return 'tour-basic';
  };
  const tourEditIssues = [
    !title.trim() ? { id: 'tour-title', label: 'Nhập tên tour' } : null,
    !(Number(durationDays) > 0) ? { id: 'tour-durationDays', label: 'Kiểm tra thời lượng tour' } : null,
    !policyId ? { id: 'tour-terms', label: 'Chọn chính sách hủy', note: 'Cần chính sách đang có hiệu lực để xuất bản.' } : null,
    existingTermsError ? { id: 'tour-terms', label: 'Tải lại điều khoản tour' } : null,
  ].filter((issue): issue is { id: string; label: string; note?: string } => Boolean(issue));

  // Synchronize initial data in Edit mode
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setDifficulty(initialData.difficulty || 'MODERATE');
      setDurationDays(String(initialData.durationDays ?? 1));
      setRequiredExperience(initialData.requiredExperience || '');
      setIncludedServices(initialData.includedServices || '');
      setExcludedServices(initialData.excludedServices || '');
      setRouteFileUrl(initialData.routeFileUrl || '');
      setTourStatus(initialData.status || 'DRAFT');
      setPolicyId(initialData.cancellationPolicyVersionId ? String(initialData.cancellationPolicyVersionId) : '');
      setCreatedTourId(mode === 'edit' ? initialData.id : null);
    }
  }, [initialData]);

  // Auto-suggest balanceDueAt when startsAt is selected if empty
  const handleStartsAtChange = (val: string) => {
    setStartsAt(val);
    if (clientErrors.startsAt) {
      setClientErrors((prev) => {
        const next = { ...prev };
        delete next.startsAt;
        return next;
      });
    }

    if (!dueEdited) setBalanceDueAt(defaultBalanceDueAt(val));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (mode === 'create' && itineraryDays.some(d => d.dayNumber > Number(durationDays) || !d.title.trim() || d.activities.some(a => !a.title.trim()))) errors.itinerary = 'Kiểm tra tiêu đề ngày, hoạt động và số ngày trong lịch trình.';
    if (tourStatus === 'PUBLISHED' && !policyId) errors.policyId = 'Vui lòng chọn chính sách hủy.';
    if (mode === 'edit' && (existingTermsError || existingTermsLoading)) errors.terms = 'Chờ tải điều khoản thành công trước khi lưu.';

    // 1. Tour validations
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Tên tour không được để trống.';
    } else if (trimmedTitle.length > 250) {
      errors.title = `Tên tour không được vượt quá 250 ký tự (hiện tại ${trimmedTitle.length}/250).`;
    }

    const parsedDuration = Number(durationDays);
    if (!durationDays.trim() || !Number.isInteger(parsedDuration) || parsedDuration < 1) {
      errors.durationDays = 'Thời lượng tour phải là số nguyên dương từ 1 ngày trở lên.';
    }

    if (routeFileUrl.trim()) {
      try {
        const parsedUrl = new URL(routeFileUrl.trim());
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          errors.routeFileUrl = 'URL tệp cung đường phải bắt đầu bằng http:// hoặc https://.';
        }
      } catch {
        errors.routeFileUrl =
          'URL tệp cung đường không hợp lệ (ví dụ: https://example.com/route.gpx).';
      }
    }

    // 2. Schedule validations (only in Create mode if schedule is not yet created)
    if (mode === 'create' && !createdScheduleId) {
      if (dateKnown && !startsAt) {
        errors.startsAt = 'Vui lòng chọn ngày và giờ khởi hành.';
      } else if (dateKnown) {
        const startDate = new Date(startsAt);
        if (isNaN(startDate.getTime())) {
          errors.startsAt = 'Ngày bắt đầu khởi hành không hợp lệ.';
        }
      }

      if (dateKnown && !balanceDueAt) {
        errors.balanceDueAt = 'Vui lòng chọn hạn thanh toán số dư.';
      } else if (dateKnown && startsAt) {
        const startDate = new Date(startsAt);
        const dueDate = new Date(balanceDueAt);
        if (isNaN(dueDate.getTime())) {
          errors.balanceDueAt = 'Hạn thanh toán không hợp lệ.';
        } else if (dueDate.getTime() > startDate.getTime()) {
          errors.balanceDueAt = 'Hạn thanh toán không được sau ngày bắt đầu khởi hành.';
        }
      }

      const parsedCap = Number(capacity);
      if (!capacity.trim() || !Number.isInteger(parsedCap) || parsedCap <= 0) {
        errors.capacity = 'Sức chứa đoàn phải là số nguyên dương (> 0 chỗ).';
      }

      const parsedBasePrice = Number(basePriceVnd);
      if (
        basePriceVnd.trim() === '' ||
        isNaN(parsedBasePrice) ||
        parsedBasePrice < 0
      ) {
        errors.basePriceVnd = 'Giá cơ bản không được âm (>= 0 đ).';
      }

      const parsedEqFee = Number(equipmentFeeVnd);
      if (
        equipmentFeeVnd.trim() === '' ||
        isNaN(parsedEqFee) ||
        parsedEqFee < 0
      ) {
        errors.equipmentFeeVnd = 'Phí thiết bị không được âm (>= 0 đ).';
      }

      const parsedDeposit = Number(depositPercent);
      if (
        depositPercent.trim() === '' ||
        isNaN(parsedDeposit) ||
        parsedDeposit <= 0 ||
        parsedDeposit > 100
      ) {
        errors.depositPercent = 'Phần trăm đặt cọc phải lớn hơn 0 và không vượt quá 100%.';
      }

      if (contactPhone.trim() && contactPhone.trim().length > 30) {
        errors.contactPhone = 'Số điện thoại liên hệ tối đa 30 ký tự.';
      }
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setStepError(null);

    // ==========================================
    // CASE 1: EDIT MODE (Updating existing tour)
    // ==========================================
    if (mode === 'edit' && createdTourId) {
      try {
        const updatePayload: UpdateTourRequest = {
          title: title.trim(),
          description: description.trim(),
          difficulty,
          durationDays: Number(durationDays),
          requiredExperience: requiredExperience.trim(),
          includedServices: includedServices.trim(),
          excludedServices: excludedServices.trim(),
          routeFileUrl: routeFileUrl.trim(),
          status: tourStatus,
          cancellationPolicyVersionId: policyId && Number(policyId) !== initialData?.cancellationPolicyVersionId ? Number(policyId) : undefined,
        };

        const updated = await toursApi.updateTour(createdTourId, updatePayload);
        await apiClient.put(`/api/v1/tours/${createdTourId}/terms`, { versionIds: selectedTerms, ...(!policyId && initialData?.cancellationPolicyVersionId ? { removeCancellationPolicy: true } : {}) });

        // Upload any newly selected photos if available
        if (selectedPhotos.length > 0) {
          for (let i = 0; i < selectedPhotos.length; i++) {
            const photo = selectedPhotos[i];
            if (photo.uploadStatus === 'success') continue;
            try {
              const res = await toursApi.uploadTourMedia(
                createdTourId,
                photo.file,
                undefined
              );
              photo.uploadStatus = 'success';
              photo.mediaId = res.id;
              if (photo.isCover) {
                await toursApi.setCoverMedia(createdTourId, res.id);
              }
            } catch {
              photo.uploadStatus = 'error';
            }
          }
        }

        toast.success(`Đã cập nhật tour "${updated.title}" thành công!`);
        navigateTo(ROUTES.ADMIN.TOUR_DETAIL(createdTourId));
      } catch (err) {
        const apiErr = err as ApiError;
        setStepError({
          step: 'tour',
          title: 'Cập nhật tour thất bại',
          message: apiErr.message || 'Không thể lưu thay đổi.',
          guidance:
            apiErr.code === 'CANCELLATION_POLICY_UNAVAILABLE' || apiErr.code === 'TOUR_CANNOT_BE_PUBLISHED'
              ? 'Chưa thể xuất bản. Hãy chọn chính sách hủy đang có hiệu lực và thử lại.'
              : undefined,
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ==========================================
    // CASE 2: CREATE MODE (Multi-step lifecycle)
    // ==========================================
    let currentTourId = createdTourId;

    // STEP 1: CREATE TOUR (if not already created in a previous attempt)
    if (!currentTourId) {
      setCurrentStep('creating_tour');
      try {
        const createTourPayload: CreateTourRequest = {
          title: title.trim(),
          description: description.trim(),
          difficulty,
          durationDays: Number(durationDays),
          requiredExperience: requiredExperience.trim(),
          includedServices: includedServices.trim(),
          excludedServices: excludedServices.trim(),
          routeFileUrl: routeFileUrl.trim(),
        };

        const created = await toursApi.createTour(createTourPayload);
        currentTourId = created.id;
        setCreatedTourId(created.id);
        
      } catch (err) {
        const apiErr = err as ApiError;
        setCurrentStep('idle');
        setIsSubmitting(false);
        setStepError({
          step: 'tour',
          title: 'Lỗi tạo thông tin tour',
          message: apiErr.message || 'Không thể tạo mới tour trekking.',
          guidance: 'Vui lòng kiểm tra lại thông tin cơ bản của tour và thử lại.',
        });
        return;
      }
    }

    // Save reusable details even when no departure date has been chosen.
    if (currentTourId && !createdScheduleId) {
      try { await toursApi.saveScheduleDefaults(currentTourId, { capacity: Number(capacity), basePriceVnd: Number(basePriceVnd), equipmentFeeVnd: Number(equipmentFeeVnd), depositPercent: Number(depositPercent), meetingPoint: meetingPoint.trim() || undefined, contactPhone: contactPhone.trim() || undefined }); }
      catch (err) { setCurrentStep('idle'); setIsSubmitting(false); setStepError({ step: 'schedule', title: 'Lưu thông tin lịch thất bại', message: (err as ApiError).message || 'Không thể lưu thông tin mặc định.', guidance: 'Tour đã được tạo. Kiểm tra thông tin và nhấn tiếp tục.' }); return; }
    }

    // STEP 2: CREATE SCHEDULE (if not already created)
    if (currentTourId && dateKnown && !createdScheduleId) {
      setCurrentStep('creating_schedule');
      try {
        const startDateObj = new Date(startsAt);
        const endDateObj = new Date(endsAt);
        const balanceDateObj = new Date(balanceDueAt);

        const schedulePayload = {
          startsAt: formatOffsetDateTime(startDateObj),
          endsAt: formatOffsetDateTime(endDateObj),
          balanceDueAt: formatOffsetDateTime(balanceDateObj),
          capacity: parseInt(capacity, 10),
          basePriceVnd: parseInt(basePriceVnd, 10),
          equipmentFeeVnd: parseInt(equipmentFeeVnd, 10),
          depositPercent: parseFloat(depositPercent),
          meetingPoint: meetingPoint.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
        };

        const scheduleRes = await toursApi.createSchedule(currentTourId, schedulePayload);
        setCreatedScheduleId(scheduleRes.id);
        toast.info(`Đã tạo lịch khởi hành.`);
      } catch (err) {
        const apiErr = err as ApiError;
        setCurrentStep('idle');
        setIsSubmitting(false);
        setStepError({
          step: 'schedule',
          title: 'Khởi tạo lịch khởi hành thất bại',
          message: `Tour đã được tạo thành công, nhưng tạo lịch khởi hành thất bại: ${apiErr.message}`,
          guidance:
            'Tour của bạn đã được lưu an toàn. Bạn có thể kiểm tra lại ngày giờ, sức chứa, hạn thanh toán và nhấn "Tiếp tục hoàn tất". Hệ thống sẽ chỉ tạo lịch mà KHÔNG tạo lại tour mới.',
        });
        return;
      }
    }

    // Save the complete itinerary before uploading media or publishing; retries reuse the same tour.
    if (currentTourId && (itineraryDays.length > 0 || itinerarySaved)) {
      setCurrentStep('saving_itinerary');
      try { await apiClient.put(`/api/v1/tours/${currentTourId}/itinerary`, { days: itineraryDays }); setItinerarySaved(true); }
      catch (err) {
        setCurrentStep('idle'); setIsSubmitting(false);
        setStepError({ step: 'itinerary', title: 'Lưu lịch trình thất bại', message: (err as ApiError).message || 'Không thể lưu lịch trình.', guidance: 'Tour và lịch khởi hành đã tạo. Kiểm tra lịch trình rồi nhấn tiếp tục; hệ thống sẽ không tạo lại tour.' });
        return;
      }
    }

    if (currentTourId && (selectedTerms.length > 0 || !!policyId || termsSaved)) {
      setCurrentStep('saving_terms');
      try { await apiClient.put(`/api/v1/tours/${currentTourId}/terms`, {versionIds:selectedTerms, ...(policyId ? { cancellationPolicyVersionId: Number(policyId) } : {})}); setTermsSaved(true); }
      catch (err) { setCurrentStep('idle'); setIsSubmitting(false); setStepError({step:'terms', title:'Lưu điều khoản thất bại', message:(err as ApiError).message || 'Không thể lưu điều khoản.', guidance:'Tour đã được tạo. Kiểm tra điều khoản rồi nhấn tiếp tục.'}); return; }
    }
    // STEP 3: UPLOAD MEDIA PHOTOS (if user selected photos)
    if (currentTourId && selectedPhotos.length > 0) {
      setCurrentStep('uploading_media');
      const updatedPhotos = [...selectedPhotos];
      let uploadHasError = false;

      for (let i = 0; i < updatedPhotos.length; i++) {
        const photo = updatedPhotos[i];
        if (photo.uploadStatus === 'success') continue;

        photo.uploadStatus = 'uploading';
        setSelectedPhotos([...updatedPhotos]);

        try {
          const mediaRes = await toursApi.uploadTourMedia(
            currentTourId,
            photo.file,
            undefined
          );
          photo.uploadStatus = 'success';
          photo.mediaId = mediaRes.id;

          // If designated as cover, call patch cover
          if (photo.isCover) {
            await toursApi.setCoverMedia(currentTourId, mediaRes.id);
          }
        } catch (err: any) {
          photo.uploadStatus = 'error';
          photo.errorMessage = err.message || 'Lỗi khi tải ảnh';
          uploadHasError = true;
        }
        setSelectedPhotos([...updatedPhotos]);
      }

      if (uploadHasError) {
        setCurrentStep('idle');
        setIsSubmitting(false);
        setStepError({
          step: 'media',
          title: 'Tải ảnh tour chưa hoàn tất',
          message: `Tour và lịch trình đã tạo thành công, nhưng một số hình ảnh tải lên thất bại.`,
          guidance:
            'Bạn có thể kiểm tra các ảnh bị lỗi bên dưới và bấm "Tiếp tục hoàn tất" để tải lại mà không phải nhập lại tour.',
        });
        return;
      }
    }

    // STEP 4: PUBLISH (if user requested PUBLISHED status)
    if (currentTourId && tourStatus === 'PUBLISHED') {
      setCurrentStep('publishing');
      try {
        const updatePayload: UpdateTourRequest = {
          title: title.trim(),
          description: description.trim(),
          difficulty,
          durationDays: Number(durationDays),
          requiredExperience: requiredExperience.trim(),
          includedServices: includedServices.trim(),
          excludedServices: excludedServices.trim(),
          routeFileUrl: routeFileUrl.trim(),
          status: 'PUBLISHED',
          cancellationPolicyVersionId: policyId ? Number(policyId) : undefined,
        };

        await toursApi.updateTour(currentTourId, updatePayload);
        toast.success(`Đã tạo và xuất bản tour thành công!`);
        navigateTo(ROUTES.ADMIN.TOUR_DETAIL(currentTourId));
        return;
      } catch (err) {
        // Backend requirement for publishing failed (e.g. reviewedBy, cancellation policy missing)
        const apiErr = err as ApiError;
        setCurrentStep('idle');
        setIsSubmitting(false);
        setStepError({
          step: 'publish',
          title: 'Chưa đủ điều kiện xuất bản ngay',
          message:
            apiErr.code === 'TOUR_CANNOT_BE_PUBLISHED'
              ? 'Tour và lịch khởi hành đã được tạo ở trạng thái bản nháp. Hãy chọn chính sách hủy đang có hiệu lực rồi thử xuất bản lại.'
              : apiErr.message || 'Không thể chuyển trạng thái xuất bản.',
          guidance:
            'Hệ thống giữ nguyên tour ở trạng thái Bản nháp (không giả lập xuất bản thành công). Bạn có thể bấm "Xem chi tiết tour" để kiểm tra hoặc xem danh sách tour.',
        });
        return;
      }
    }

    // ALL DONE FOR DRAFT STATUS
    setCurrentStep('done');
    setIsSubmitting(false);
    toast.success(`Đã tạo tour "${title}" và lịch khởi hành thành công!`);
    if (currentTourId) {
      navigateTo(ROUTES.ADMIN.TOUR_DETAIL(currentTourId));
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 pb-4" aria-busy={isSubmitting}>
      <nav aria-label="Điều hướng biểu mẫu tour" className="rounded-2xl border border-[#d5ddd3] bg-[#f5f7f3] p-2 shadow-sm">
        <div className="flex flex-wrap gap-1">{editorSections.map((section) => <button key={section.id} type="button" aria-current={activeSection === section.id ? 'step' : undefined} onClick={() => setActiveSection(section.id)} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${activeSection === section.id ? 'bg-[#dceee3] text-[#173b2e]' : 'text-[#285343] hover:bg-[#e7f1eb]'}`}>
          {section.ready ? <CheckCircle className="h-4 w-4 text-[#16845f]" /> : section.optional ? <Circle className="h-4 w-4 text-slate-400" /> : <AlertTriangle className="h-4 w-4 text-[#c2410c]" />}
          {section.label}<span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${section.ready ? 'bg-[#dff1e4] text-[#246344]' : section.optional ? 'bg-slate-100 text-slate-600' : 'bg-[#fff0e8] text-[#a33e16]'}`}>{section.ready ? 'Sẵn sàng' : section.optional ? 'Tùy chọn' : 'Cần xem'}</span>
        </button>)}</div>
      </nav>
      {mode === 'edit' && tourEditIssues.length > 0 && <section role="status" aria-label="Tình trạng hoàn thiện tour" className="overflow-hidden rounded-2xl border border-[#f5b7ad] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fff1ee] px-5 py-3 text-[#9f2f22]"><h2 className="flex items-center gap-2 font-bold"><AlertTriangle className="h-5 w-5" />Còn {tourEditIssues.length} mục cần kiểm tra</h2><span className="text-sm font-medium">{readySections}/{editorSections.length} mục đã sẵn sàng</span></div>
        <ul className="divide-y divide-[#f1ded9] px-5">{tourEditIssues.map((issue) => <li key={`${issue.id}-${issue.label}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm"><span className="font-semibold text-[#283b32]">{issue.label}{issue.note && <span className="ml-2 font-normal text-slate-600">{issue.note}</span>}</span><button type="button" onClick={() => setActiveSection(sectionForTarget(issue.id))} className="shrink-0 font-semibold text-[#126347] underline-offset-4 hover:underline">Đi tới mục <span aria-hidden="true">→</span></button></li>)}</ul>
      </section>}
      {Object.keys(clientErrors).length > 0 && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
        <p className="font-semibold">Vui lòng kiểm tra các mục sau trước khi lưu</p>
        <ul className="mt-3 space-y-2">{Object.entries(clientErrors).map(([field, message]) => <li key={field}><button type="button" onClick={() => setActiveSection(sectionForTarget(field))} className="text-left underline underline-offset-4">{message}</button></li>)}</ul>
      </div>}
      {/* Step / Lifecycle Error Alert */}
      {stepError && (
        <div
          role="alert"
          className="rounded-2xl bg-amber-50 border border-amber-300 p-5 text-slate-800 space-y-2 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm space-y-1">
              <h3 className="font-bold text-base text-amber-900">
                {stepError.title || 'Thông báo xử lý từng bước'}
              </h3>
              <p className="text-slate-700 leading-relaxed">{stepError.message}</p>
              {stepError.guidance && (
                <p className="text-amber-800 font-medium bg-white/80 p-2.5 rounded-xl border border-amber-200 mt-2">
                  💡 {stepError.guidance}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions if tour was already created */}
          {createdTourId && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/80">
              <span className="text-xs text-slate-500 font-mono">
                Tour đã được tạo
              </span>
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.ADMIN.TOUR_DETAIL(createdTourId))}
                className="px-3 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 text-sm font-semibold hover:bg-amber-100/50 cursor-pointer"
              >
                Xem chi tiết tour đã tạo
              </button>
              <button
                type="button"
                onClick={() => navigateTo(ROUTES.ADMIN.TOURS)}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Về danh sách tour
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress Indicator for Create Mode */}
      {mode === 'create' && createdTourId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-sm text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Tour đã được khởi tạo trong hệ thống.
              {!createdScheduleId
                ? (dateKnown ? ' Đang chờ hoàn tất lịch khởi hành đầu tiên.' : ' Chưa có lịch khởi hành.')
                : ' Lịch khởi hành đã hoàn tất.'}
            </span>
          </div>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            {createdScheduleId ? 'Lịch đã tạo' : dateKnown ? 'Cần tạo lịch' : 'Bổ sung lịch sau'}
          </span>
        </div>
      )}

      {/* CARD 1: THÔNG TIN CƠ BẢN CỦA TOUR */}
      <div id="tour-basic" hidden={activeSection !== 'tour-basic'} className="scroll-mt-8 bg-white rounded-2xl border border-[#d5ddd3] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-sans text-xl font-bold text-[#172033]">
              1. Thông tin cơ bản của tour trekking
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Tên hành trình, độ khó, thời lượng chuyến đi và trạng thái mong muốn.
            </p>
          </div>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="tour-title" className="text-sm font-bold text-[#172033]">
              Tên tour trekking <span className="text-rose-600">*</span>
            </label>
            <span
              className={`text-xs font-mono ${
                title.length > 250 ? 'text-rose-600 font-bold' : 'text-slate-400'
              }`}
            >
              {title.length}/250 ký tự
            </span>
          </div>
          <input
            id="tour-title"
            type="text"
            required
            maxLength={250}
            disabled={isSubmitting || (mode === 'create' && createdTourId !== null)}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (clientErrors.title) {
                setClientErrors((p) => {
                  const n = { ...p };
                  delete n.title;
                  return n;
                });
              }
            }}
            placeholder="Ví dụ: Chinh phục Tà Năng - Phan Dũng"
            className={`w-full px-4 py-2.5 rounded-xl border text-base bg-[#F3F6FA] focus:bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 transition-all ${
              clientErrors.title ? 'border-rose-500' : 'border-slate-300 focus:border-[#0B7058]'
            } ${createdTourId && mode === 'create' ? 'bg-slate-100 cursor-not-allowed' : ''}`}
          />
          {clientErrors.title && (
            <p className="text-sm text-rose-600 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{clientErrors.title}</span>
            </p>
          )}
        </div>

        {/* Difficulty, Duration, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Difficulty */}
          <div>
            <label htmlFor="tour-difficulty" className="block text-sm font-bold text-[#172033] mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-[#0B7058]" />
                <span>Độ khó tour *</span>
              </span>
            </label>
            <select
              id="tour-difficulty"
              disabled={isSubmitting || (mode === 'create' && createdTourId !== null)}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-[#F3F6FA] focus:bg-white text-base text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Days */}
          <div>
            <label htmlFor="tour-durationDays" className="block text-sm font-bold text-[#172033] mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0B7058]" />
                <span>Thời lượng tour (số ngày) *</span>
              </span>
            </label>
            <input
              id="tour-durationDays"
              type="number"
              min={1}
              step={1}
              required
              disabled={isSubmitting || (mode === 'create' && createdTourId !== null)}
              value={durationDays}
              onChange={(e) => {
                setDurationDays(e.target.value);
                if (clientErrors.durationDays) {
                  setClientErrors((p) => {
                    const n = { ...p };
                    delete n.durationDays;
                    return n;
                  });
                }
              }}
              placeholder="Ví dụ: 2"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-mono bg-[#F3F6FA] focus:bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 ${
                clientErrors.durationDays ? 'border-rose-500' : 'border-slate-300 focus:border-[#0B7058]'
              } ${createdTourId && mode === 'create' ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            />
            {clientErrors.durationDays && (
              <p className="text-sm text-rose-600 mt-1.5">{clientErrors.durationDays}</p>
            )}
          </div>

          {/* Status Choice */}
          <div>
            <label htmlFor="tour-status" className="block text-sm font-bold text-[#172033] mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>Trạng thái tour *</span>
              </span>
            </label>
            <select
              id="tour-status"
              disabled={isSubmitting}
              value={tourStatus}
              onChange={(e) => setTourStatus(e.target.value as TourStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-[#F3F6FA] focus:bg-white text-base text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 cursor-pointer"
            >
              {mode === 'create' ? (
                <>
                  <option value="DRAFT">Bản nháp</option>
                  <option value="PUBLISHED">Xuất bản</option>
                </>
              ) : (
                TOUR_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              )}
            </select>
            
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="tour-description" className="block text-sm font-bold text-[#172033] mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#0B7058]" />
              <span>Giới thiệu tour</span>
            </span>
          </label>
          <textarea
            id="tour-description"
            rows={4}
            disabled={isSubmitting || (mode === 'create' && createdTourId !== null)}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả cảnh quan cung đường, những trải nghiệm ấn tượng và hoạt động chính..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-[#F3F6FA] focus:bg-white text-base text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {mode === 'create' && <div id="tour-itinerary" hidden={activeSection !== 'tour-itinerary'} className="scroll-mt-8"><TourItineraryDraftEditor days={itineraryDays} onChange={setItineraryDays} duration={Number(durationDays)} disabled={isSubmitting} /></div>}
      {activeSection === 'tour-itinerary' && clientErrors.itinerary && <p role="alert" className="text-sm text-rose-700">{clientErrors.itinerary}</p>}

      {<section id="tour-terms" hidden={activeSection !== 'tour-terms'} className="scroll-mt-8 space-y-3 rounded-2xl border border-[#E0E6EE] bg-white p-6"><h2 className="text-xl font-bold">Điều khoản & lưu ý</h2><p className="text-sm text-slate-600">Chọn các điều khoản áp dụng cho tour.</p>{termsError && <p role="alert" className="text-rose-700">{termsError}</p>}{clientErrors.terms && <p role="alert" className="text-rose-700">{clientErrors.terms}</p>}{existingTermsLoading && <p className="text-sm text-slate-500">Đang tải điều khoản của tour...</p>}{existingTermsError && <p role="alert" className="text-rose-700">Không tải được điều khoản của tour. Vui lòng tải lại trang.</p>}{existingTerms.filter(t => !termsOptions.some(o => o.id === t.versionId)).map(t => <label key={t.versionId} className="flex items-start gap-3 rounded-lg border border-amber-300 p-3"><input type="checkbox" disabled={isSubmitting} checked={t.primaryCancellation ? policyId === String(t.versionId) : selectedTerms.includes(t.versionId)} onChange={e => { if (t.primaryCancellation) setPolicyId(e.target.checked ? String(t.versionId) : ''); else setSelectedTerms(prev => e.target.checked ? [...prev,t.versionId] : prev.filter(id => id !== t.versionId)); }}/><span>{t.title} <span className="text-sm text-amber-800">(không còn hiệu lực)</span></span></label>)}{clientErrors.policyId && <p role="alert" className="text-rose-700">{clientErrors.policyId}</p>}{termsOptions.length === 0 && !termsError && <p className="text-sm text-slate-500">Chưa có điều khoản đang có hiệu lực.</p>}{termsOptions.map(t => <label key={t.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3"><input type="checkbox" disabled={isSubmitting} checked={t.kind === 'cancellation' ? policyId === String(t.id) : selectedTerms.includes(t.id)} onChange={e => { if (t.kind === 'cancellation') setPolicyId(e.target.checked ? String(t.id) : ''); else setSelectedTerms(prev => e.target.checked ? [...prev,t.id] : prev.filter(id => id !== t.id)); }}/><span>{t.title} <span className="text-sm text-slate-500">(phiên bản {t.versionNumber}){t.kind === 'cancellation' ? ' · đổi/hủy' : ''}</span></span></label>)}<p className="text-sm text-slate-500">Chọn một chính sách đổi/hủy có hiệu lực để xuất bản tour. Chọn chính sách đổi/hủy khác sẽ thay thế lựa chọn cũ.</p><div className="flex flex-wrap gap-4"><a href={ROUTES.ADMIN.POLICIES} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-800 underline">Quản lý điều khoản & lưu ý (mở tab mới)</a><button type="button" onClick={loadTerms} className="text-sm text-emerald-800 underline">Tải lại danh sách</button></div></section>}

      {mode === 'edit' && initialData?.id && <div id="tour-equipment" hidden={activeSection !== 'tour-equipment'} className="scroll-mt-8"><TourEquipmentEditor tourId={initialData.id} /><p className="mt-3 text-sm text-slate-600">Thiết bị được lưu riêng bằng thao tác trong mục này.</p></div>}
      {/* CARD 2: DỊCH VỤ, YÊU CẦU & FILE CUNG ĐƯỜNG */}
      <div id="tour-preparation" hidden={activeSection !== 'tour-preparation'} className="scroll-mt-8 bg-white rounded-2xl border border-[#E0E6EE] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="font-sans text-xl font-bold text-[#172033]">
            2. Thể lực, dịch vụ & Tệp bản đồ cung đường
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Yêu cầu chuẩn bị và đường dẫn tệp GPS/GPX.
          </p>
        </div>

        {/* Required Experience */}
        <div>
          <label htmlFor="tour-requiredExperience" className="block text-sm font-bold text-[#172033] mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Yêu cầu kinh nghiệm & thể lực</span>
            </span>
          </label>
          <textarea
            id="tour-requiredExperience"
            rows={2}
            disabled={isSubmitting || (mode === 'create' && createdTourId !== null)}
            value={requiredExperience}
            onChange={(e) => setRequiredExperience(e.target.value)}
            placeholder="Ví dụ: Thể lực tốt, có khả năng đi bộ 10-15km đường đồi dốc..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-[#F3F6FA] focus:bg-white text-base text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Included & Excluded Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="tour-includedServices" className="block text-sm font-bold text-[#172033] mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dịch vụ bao gồm</span>
              </span>
            </label>
            <textarea
              id="tour-includedServices"
              rows={3}
              disabled={isSubmitting || (mode === 'create' && createdTourId !== null)}
              value={includedServices}
              onChange={(e) => setIncludedServices(e.target.value)}
              placeholder="Ví dụ: Xe đưa đón, hướng dẫn viên, porter, lều trại, bảo hiểm du lịch..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-[#F3F6FA] focus:bg-white text-base text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="tour-excludedServices" className="block text-sm font-bold text-[#172033] mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Dịch vụ không bao gồm</span>
              </span>
            </label>
            <textarea
              id="tour-excludedServices"
              rows={3}
              disabled={isSubmitting || (mode === 'create' && createdTourId !== null)}
              value={excludedServices}
              onChange={(e) => setExcludedServices(e.target.value)}
              placeholder="Ví dụ: Chi phí cá nhân, đồ uống ngoài chương trình, tiền tip..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-[#F3F6FA] focus:bg-white text-base text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Route File URL (Separated from image uploads) */}
        <div>
          <label htmlFor="tour-routeFileUrl" className="block text-sm font-bold text-[#172033] mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#0B7058]" />
              <span>Đường dẫn tệp bản đồ / cung đường GPS</span>
            </span>
          </label>
          <input
            id="tour-routeFileUrl"
            type="url"
            disabled={isSubmitting || (mode === 'create' && createdTourId !== null)}
            value={routeFileUrl}
            onChange={(e) => {
              setRouteFileUrl(e.target.value);
              if (clientErrors.routeFileUrl) {
                setClientErrors((p) => {
                  const n = { ...p };
                  delete n.routeFileUrl;
                  return n;
                });
              }
            }}
            placeholder="https://example.com/route.gpx"
            className={`w-full px-4 py-2.5 rounded-xl border text-base font-mono bg-[#F3F6FA] focus:bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 ${
              clientErrors.routeFileUrl
                ? 'border-rose-500'
                : 'border-slate-300 focus:border-[#0B7058]'
            } ${createdTourId && mode === 'create' ? 'bg-slate-100 cursor-not-allowed' : ''}`}
          />
          {clientErrors.routeFileUrl ? (
            <p className="text-sm text-rose-600 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{clientErrors.routeFileUrl}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* CARD 3: ẢNH TOUR (TOUR MEDIA) */}
      <div id="tour-media" hidden={activeSection !== 'tour-media'} className="scroll-mt-8 bg-white rounded-2xl border border-[#E0E6EE] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="font-sans text-xl font-bold text-[#172033]">
            3. Hình ảnh tour & Ảnh bìa
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Chọn ảnh từ máy tính, xem trước ảnh, chỉ định ảnh bìa và tải lên hệ thống lưu trữ.
          </p>
        </div>

        <TourMediaPicker
          photos={selectedPhotos}
          onChange={setSelectedPhotos}
          disabled={isSubmitting}
        />
      </div>

      {/* CARD 4: LỊCH KHỞI HÀNH ĐẦU TIÊN (FIRST DEPARTURE SCHEDULE) */}
      {mode === 'create' && (
        <div id="tour-departure" hidden={activeSection !== 'tour-departure'} className="scroll-mt-8 bg-white rounded-2xl border border-[#E0E6EE] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-sans text-xl font-bold text-[#172033]">
                4. Lịch khởi hành đầu tiên của tour
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Lưu giá và thông tin dự kiến. Có thể bổ sung ngày khởi hành sau.
              </p>
            </div>
            {createdScheduleId && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                Đã tạo lịch khởi hành
              </span>
            )}
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-base font-semibold"><input type="checkbox" checked={dateKnown} disabled={isSubmitting || Boolean(createdScheduleId)} onChange={e => setDateKnown(e.target.checked)} /> Đã xác định ngày khởi hành</label>
          {!dateKnown && <p className="text-sm text-slate-600">Chưa tạo lịch khởi hành. Bạn có thể thêm ngày sau tại mục Lịch khởi hành.</p>}
          {dateKnown && <>
          {/* StartsAt and EndsAt (auto-calculated, read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* StartsAt */}
            <div>
              <label htmlFor="schedule-startsAt" className="block text-sm font-bold text-[#172033] mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0B7058]" />
                  <span>Ngày & giờ bắt đầu khởi hành *</span>
                </span>
              </label>
              <LargeDateTimePicker id="schedule-startsAt" value={startsAt} onChange={handleStartsAtChange} disabled={isSubmitting || Boolean(createdScheduleId)} />
              {clientErrors.startsAt && (
                <p className="text-sm text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{clientErrors.startsAt}</span>
                </p>
              )}
            </div>

            {/* EndsAt (read-only, auto calculated = startsAt + durationDays) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="schedule-endsAt" className="text-sm font-bold text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ngày & giờ kết thúc</span>
                  </span>
                </label>
              </div>
              <input
                id="schedule-endsAt"
                type="text"
                readOnly
                value={displayLocalDateTime(endsAt)}
                placeholder="Chọn ngày bắt đầu"
                className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-normal text-slate-800 cursor-not-allowed"
              />
            </div>
          </div>

          </>}
          {/* BalanceDueAt, Capacity, DepositPercent */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* BalanceDueAt */}
            {dateKnown && <div>
              <label htmlFor="schedule-balanceDueAt" className="block text-sm font-bold text-[#172033] mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Hạn chót thanh toán số dư *</span>
                </span>
              </label>
              <LargeDateTimePicker id="schedule-balanceDueAt" label="thanh toán" value={balanceDueAt} disabled={isSubmitting || createdScheduleId !== null} onChange={value => { setDueEdited(true); setBalanceDueAt(value); if (clientErrors.balanceDueAt) setClientErrors(prev => { const next = { ...prev }; delete next.balanceDueAt; return next; }); }} />
              {clientErrors.balanceDueAt ? (
                <p className="text-sm text-rose-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{clientErrors.balanceDueAt}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  Phải trước hoặc cùng thời điểm ngày bắt đầu.
                </p>
              )}
            </div>}
            {/* Capacity */}
            <div>
              <label htmlFor="schedule-capacity" className="block text-sm font-bold text-[#172033] mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0B7058]" />
                  <span>Sức chứa đoàn (số chỗ) *</span>
                </span>
              </label>
              <input
                id="schedule-capacity"
                type="number"
                min={1}
                step={1}
                required
                disabled={isSubmitting || createdScheduleId !== null}
                value={capacity}
                onChange={(e) => {
                  setCapacity(e.target.value);
                  if (clientErrors.capacity) {
                    setClientErrors((p) => {
                      const n = { ...p };
                      delete n.capacity;
                      return n;
                    });
                  }
                }}
                placeholder="Ví dụ: 15"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-mono bg-[#F3F6FA] focus:bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 ${
                  clientErrors.capacity ? 'border-rose-500' : 'border-slate-300 focus:border-[#0B7058]'
                } ${createdScheduleId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              />
              {clientErrors.capacity ? (
                <p className="text-sm text-rose-600 mt-1.5">{clientErrors.capacity}</p>
              ) : null}
            </div>

            {/* Deposit Percent */}
            <div>
              <label htmlFor="schedule-depositPercent" className="block text-sm font-bold text-[#172033] mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Tỷ lệ đặt cọc (%) *</span>
                </span>
              </label>
              <input
                id="schedule-depositPercent"
                type="number"
                min={1}
                max={100}
                step={1}
                required
                disabled={isSubmitting || createdScheduleId !== null}
                value={depositPercent}
                onChange={(e) => {
                  setDepositPercent(e.target.value);
                  if (clientErrors.depositPercent) {
                    setClientErrors((p) => {
                      const n = { ...p };
                      delete n.depositPercent;
                      return n;
                    });
                  }
                }}
                placeholder="Ví dụ: 30"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-mono bg-[#F3F6FA] focus:bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 ${
                  clientErrors.depositPercent ? 'border-rose-500' : 'border-slate-300 focus:border-[#0B7058]'
                } ${createdScheduleId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              />
              {clientErrors.depositPercent ? (
                <p className="text-sm text-rose-600 mt-1.5">{clientErrors.depositPercent}</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Từ 1% đến 100%</p>
              )}
            </div>
          </div>

          {/* BasePriceVnd and EquipmentFeeVnd */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Base Price */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="schedule-basePriceVnd" className="text-sm font-bold text-[#172033]">
                  Giá tour cơ bản (VNĐ) *
                </label>
                <span className="text-xs font-mono text-[#0B7058] font-semibold">
                  {formatVND(Number(basePriceVnd))}
                </span>
              </div>
              <input
                id="schedule-basePriceVnd"
                type="number"
                min={0}
                step={50000}
                required
                disabled={isSubmitting || createdScheduleId !== null}
                value={basePriceVnd}
                onChange={(e) => {
                  setBasePriceVnd(e.target.value);
                  if (clientErrors.basePriceVnd) {
                    setClientErrors((p) => {
                      const n = { ...p };
                      delete n.basePriceVnd;
                      return n;
                    });
                  }
                }}
                placeholder="Ví dụ: 2500000"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-mono bg-[#F3F6FA] focus:bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 ${
                  clientErrors.basePriceVnd ? 'border-rose-500' : 'border-slate-300 focus:border-[#0B7058]'
                } ${createdScheduleId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              />
              {clientErrors.basePriceVnd && (
                <p className="text-sm text-rose-600 mt-1.5">{clientErrors.basePriceVnd}</p>
              )}
            </div>

            {/* Equipment Fee */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="schedule-equipmentFeeVnd" className="text-sm font-bold text-[#172033]">
                  Phí thuê thiết bị (VNĐ) *
                </label>
                <span className="text-xs font-mono text-[#0B7058] font-semibold">
                  {formatVND(Number(equipmentFeeVnd))}
                </span>
              </div>
              <input
                id="schedule-equipmentFeeVnd"
                type="number"
                min={0}
                step={10000}
                required
                disabled={isSubmitting || createdScheduleId !== null}
                value={equipmentFeeVnd}
                onChange={(e) => {
                  setEquipmentFeeVnd(e.target.value);
                  if (clientErrors.equipmentFeeVnd) {
                    setClientErrors((p) => {
                      const n = { ...p };
                      delete n.equipmentFeeVnd;
                      return n;
                    });
                  }
                }}
                placeholder="Ví dụ: 200000"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-mono bg-[#F3F6FA] focus:bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 ${
                  clientErrors.equipmentFeeVnd ? 'border-rose-500' : 'border-slate-300 focus:border-[#0B7058]'
                } ${createdScheduleId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              />
              {clientErrors.equipmentFeeVnd && (
                <p className="text-sm text-rose-600 mt-1.5">{clientErrors.equipmentFeeVnd}</p>
              )}
            </div>
          </div>

          {/* Meeting Point and Contact Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Meeting Point */}
            <div>
              <label htmlFor="schedule-meetingPoint" className="block text-sm font-bold text-[#172033] mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0B7058]" />
                  <span>Điểm tập trung xuất phát</span>
                </span>
              </label>
              <input
                id="schedule-meetingPoint"
                type="text"
                disabled={isSubmitting || createdScheduleId !== null}
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                placeholder="Ví dụ: Cổng Bến xe Mỹ Đình, Hà Nội"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-[#F3F6FA] focus:bg-white text-base text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label htmlFor="schedule-contactPhone" className="block text-sm font-bold text-[#172033] mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#0B7058]" />
                  <span>Số điện thoại liên hệ điều hành</span>
                </span>
              </label>
              <input
                id="schedule-contactPhone"
                type="tel"
                maxLength={30}
                disabled={isSubmitting || createdScheduleId !== null}
                value={contactPhone}
                onChange={(e) => {
                  setContactPhone(e.target.value);
                  if (clientErrors.contactPhone) {
                    setClientErrors((p) => {
                      const n = { ...p };
                      delete n.contactPhone;
                      return n;
                    });
                  }
                }}
                placeholder="Ví dụ: 0912345678"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-mono bg-[#F3F6FA] focus:bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0B7058]/20 ${
                  clientErrors.contactPhone ? 'border-rose-500' : 'border-slate-300 focus:border-[#0B7058]'
                } ${createdScheduleId ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              />
              {clientErrors.contactPhone && (
                <p className="text-sm text-rose-600 mt-1.5">{clientErrors.contactPhone}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Action Footer */}
      <div className="sticky bottom-0 z-30 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#d5ddd3] bg-[#fbfcfa]/95 p-4 shadow-[0_-8px_24px_rgba(23,59,46,0.08)] backdrop-blur-sm sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Hủy & Quay lại</span>
        </button>

        <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
        <button type="button" onClick={() => setActiveSection(editorSections[Math.max(0, activeSectionIndex - 1)].id)} disabled={isSubmitting || activeSectionIndex === 0} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40">← Mục trước</button>
        {activeSectionIndex < editorSections.length - 1 && <button type="button" onClick={() => setActiveSection(editorSections[activeSectionIndex + 1].id)} disabled={isSubmitting} className="rounded-xl border border-[#b7c9ba] bg-white px-4 py-3 text-sm font-semibold text-[#176a50] disabled:opacity-40">Mục tiếp theo →</button>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-7 py-3 rounded-xl bg-[#0B7058] hover:bg-[#075743] text-white font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#B9EADB]" />
              <span>
                {currentStep === 'creating_tour'
                  ? 'Đang tạo tour...'
                  : currentStep === 'creating_schedule'
                  ? 'Đang tạo lịch khởi hành...'
                  : currentStep === 'saving_terms' ? 'Đang lưu điều khoản...' : currentStep === 'saving_itinerary' ? 'Đang lưu lịch trình...' : currentStep === 'uploading_media'
                  ? 'Đang tải ảnh tour...'
                  : currentStep === 'publishing'
                  ? 'Đang kiểm tra xuất bản...'
                  : 'Đang xử lý...'}
              </span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>
                {mode === 'edit'
                  ? 'Lưu thay đổi tour'
                  : createdTourId
                  ? 'Tiếp tục hoàn tất các bước'
                  : dateKnown ? 'Tạo tour & lịch khởi hành' : 'Tạo tour'}
              </span>
            </>
          )}
        </button>
        </div>
      </div>
    </form>
  );
};
