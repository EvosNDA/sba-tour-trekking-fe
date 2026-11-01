import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Boxes,
  Package,
  Wrench,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Info,
  X,
  Edit3,
} from 'lucide-react';
import { equipmentApi } from '../../equipment/api/equipment.api';
import type {
  TourEquipmentResponse,
  TourRentalPackage,
  RentalPackageTemplate,
  EquipmentCatalogItem,
} from '../../equipment/types/equipment.types';
import { formatVND } from '../../../lib/utils';
import { ROUTES } from '../../../constants/routes';
import { toast } from '../../../components/ui/Toast';

export interface TourEquipmentEditorProps {
  tourId: number;
  className?: string;
  onUpdated?: () => void;
}

function extractSavedPackages(data: TourEquipmentResponse | null): TourRentalPackage[] {
  if (!data) return [];
  if (Array.isArray(data.packages)) {
    return data.packages;
  }
  if (data.equipmentPackage && data.equipmentPackage.packageTemplateId != null) {
    return [data.equipmentPackage];
  }
  return [];
}

function hasTemplateChangedSinceSnapshot(
  savedPkg: TourRentalPackage,
  template: RentalPackageTemplate | undefined
): boolean {
  if (!template) return false;
  if (savedPkg.title !== template.title || savedPkg.rentalPriceVnd !== template.rentalPriceVnd) {
    return true;
  }
  const savedItems = savedPkg.items ?? [];
  const tplItems = template.items ?? [];
  if (savedItems.length !== tplItems.length) {
    return true;
  }
  const savedMap = new Map(
    savedItems.map((item) => [item.equipmentId, item.quantityInPackage ?? 1])
  );
  for (const tplItem of tplItems) {
    if (savedMap.get(tplItem.equipmentId) !== tplItem.quantityInPackage) {
      return true;
    }
  }
  return false;
}

export const TourEquipmentEditor: React.FC<TourEquipmentEditorProps> = ({
  tourId,
  className = '',
  onUpdated,
}) => {
  const [equipmentData, setEquipmentData] = useState<TourEquipmentResponse | null>(null);
  const [configVersion, setConfigVersion] = useState<number>(0);
  const [packages, setPackages] = useState<RentalPackageTemplate[]>([]);
  const [catalog, setCatalog] = useState<EquipmentCatalogItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // Configuration editing mode
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedPackageIds, setSelectedPackageIds] = useState<number[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>([]);

  const syncSelections = useCallback((tourEq: TourEquipmentResponse | null) => {
    const savedPkgs = extractSavedPackages(tourEq);
    const pkgIds = savedPkgs
      .map((p) => p.packageTemplateId)
      .filter((id): id is number => id != null);
    const standaloneItems = tourEq?.individualItems ?? tourEq?.items ?? [];
    const indivIds = standaloneItems.map((i) => i.equipmentId);
    setSelectedPackageIds(Array.from(new Set(pkgIds)));
    setSelectedEquipmentIds(Array.from(new Set(indivIds)));
  }, []);

  // Fetch tour equipment & available packages/catalog
  const loadAllData = useCallback(
    async (silent = false, preserveDraftSelections = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);
      setConflictMessage(null);

      try {
        const [tourEq, pkgs, cat] = await Promise.all([
          equipmentApi.getTourEquipment(tourId),
          equipmentApi.listPackages(),
          equipmentApi.listCatalog(),
        ]);
        setEquipmentData(tourEq);
        setConfigVersion(tourEq?.version ?? 0);
        setPackages(pkgs);
        setCatalog(cat);
        if (!preserveDraftSelections) {
          syncSelections(tourEq);
        }
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        setError(apiErr?.message || 'Không thể tải thông tin thiết bị cho tour này.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [tourId, syncSelections]
  );

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const savedPackages = useMemo(() => extractSavedPackages(equipmentData), [equipmentData]);
  const savedIndividualItems = useMemo(
    () => equipmentData?.individualItems ?? equipmentData?.items ?? [],
    [equipmentData]
  );
  const needsLegacyReview = useMemo(
    () =>
      Boolean(equipmentData?.needsReview) ||
      savedPackages.some((pkg) => Boolean(pkg.needsReview)),
    [equipmentData, savedPackages]
  );

  // Equipment IDs included in currently selected packages (for informational badge only, NOT disabled)
  const packageItemIds = useMemo(() => {
    const ids = new Set<number>();
    for (const pkg of packages) {
      if (selectedPackageIds.includes(pkg.id)) {
        for (const item of pkg.items ?? []) {
          ids.add(item.equipmentId);
        }
      }
    }
    return ids;
  }, [packages, selectedPackageIds]);

  // Toggle combo checkbox
  const handleTogglePackage = (pkgId: number) => {
    setSelectedPackageIds((prev) =>
      prev.includes(pkgId) ? prev.filter((id) => id !== pkgId) : [...prev, pkgId]
    );
  };

  // Toggle individual equipment checkbox
  const handleToggleEquipment = (eqId: number) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId]
    );
  };

  // Clear all selections in form
  const handleClearAllSelections = () => {
    setSelectedPackageIds([]);
    setSelectedEquipmentIds([]);
  };

  // Reload latest server config after a 409 conflict
  const handleReloadLatestConfig = async () => {
    await loadAllData(true, false);
    toast.success('Đã tải lại cấu hình thiết bị mới nhất của tour.');
  };

  // Save changes via PUT /api/v1/tours/{tourId}/equipment
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setConflictMessage(null);
    try {
      const uniquePackageIds = Array.from(new Set(selectedPackageIds));
      const uniqueIndividualIds = Array.from(new Set(selectedEquipmentIds));

      const updated = await equipmentApi.assignTourEquipment(tourId, {
        version: configVersion,
        packageTemplateIds: uniquePackageIds,
        individualEquipmentIds: uniqueIndividualIds,
      });

      setEquipmentData(updated);
      setConfigVersion(updated?.version ?? configVersion + 1);
      syncSelections(updated);
      toast.success('Đã cập nhật cấu hình thiết bị cho tour thành công.');
      setIsEditing(false);
      await loadAllData(true);
      onUpdated?.();
    } catch (err: unknown) {
      const apiErr = err as { status?: number; code?: string; message?: string };
      if (apiErr?.status === 409 || apiErr?.code === 'EQUIPMENT_CONFIG_CONFLICT') {
        const msg =
          'Cấu hình thiết bị của tour vừa được quản trị viên khác cập nhật. Hệ thống đã chặn lưu đè để bảo vệ dữ liệu mới. Các lựa chọn bạn đang đánh dấu vẫn được giữ nguyên trên màn hình — hãy tải lại cấu hình mới nhất để đối chiếu trước khi lưu.';
        setConflictMessage(msg);
        toast.error('Cấu hình thiết bị đã thay đổi ở phiên khác. Vui lòng tải lại trước khi lưu.');
      } else {
        setError(apiErr?.message || 'Có lỗi xảy ra khi lưu thiết bị cho tour.');
        toast.error(apiErr?.message || 'Có lỗi xảy ra khi gán thiết bị cho tour.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Unlink all equipment from tour
  const handleUnlinkAll = async () => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn gỡ toàn bộ thiết bị và combo khỏi tour này?\n\nLưu ý: Thao tác này chỉ hủy liên kết với tour, không xóa khỏi thư viện dùng chung.'
      )
    ) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setConflictMessage(null);
    try {
      const updated = await equipmentApi.assignTourEquipment(tourId, {
        version: configVersion,
        packageTemplateIds: [],
        individualEquipmentIds: [],
      });
      setEquipmentData(updated);
      setConfigVersion(updated?.version ?? configVersion + 1);
      syncSelections(updated);
      toast.success('Đã gỡ toàn bộ thiết bị khỏi tour.');
      setIsEditing(false);
      await loadAllData(true);
      onUpdated?.();
    } catch (err: unknown) {
      const apiErr = err as { status?: number; code?: string; message?: string };
      if (apiErr?.status === 409 || apiErr?.code === 'EQUIPMENT_CONFIG_CONFLICT') {
        setConflictMessage(
          'Cấu hình thiết bị của tour vừa được quản trị viên khác cập nhật. Vui lòng bấm "Tải lại cấu hình mới nhất" để xem dữ liệu hiện tại trước khi gỡ.'
        );
        toast.error('Cấu hình thiết bị đã thay đổi ở phiên khác. Vui lòng tải lại.');
      } else {
        setError(apiErr?.message || 'Không thể gỡ thiết bị khỏi tour.');
        toast.error(apiErr?.message || 'Không thể gỡ thiết bị khỏi tour.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    setConflictMessage(null);
    syncSelections(equipmentData);
  };

  const hasEquipment = savedPackages.length > 0 || savedIndividualItems.length > 0;

  return (
    <div
      className={`bg-white rounded-2xl border border-[#E6E1D8] p-6 shadow-2xs space-y-5 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1C2526] flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#1F4E43]" />
            <span>Thiết bị cho tour</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Chọn nhiều gói combo thiết bị và/hoặc nhiều thiết bị lẻ cung cấp cho khách thuê trong
            chuyến đi này.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={ROUTES.ADMIN.EQUIPMENT}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 inline-flex items-center gap-1.5 transition-colors"
            title="Mở thư viện thiết bị & combo trên tab mới"
          >
            <span>Quản lý kho thiết bị</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </a>

          <button
            type="button"
            onClick={() => loadAllData(true, isEditing)}
            disabled={isRefreshing || isLoading}
            className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors disabled:opacity-50"
            title="Tải lại danh sách thiết bị từ kho"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1F4E43]' : ''}`} />
          </button>

          {!isEditing && hasEquipment && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Thay đổi cấu hình</span>
            </button>
          )}
        </div>
      </div>

      {/* Note about unlinking, overlap & snapshot behavior */}
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-xs text-stone-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-stone-800">Quy ước:</strong> Một thiết bị đã nằm trong combo vẫn
          có thể được chọn thêm ở mục thuê lẻ. Khi gắn combo vào tour, hệ thống lưu bản chụp thành
          phần &amp; giá tại thời điểm lưu — sửa combo mẫu trong kho sẽ không tự động thay đổi cấu
          hình của tour đã gắn cho đến khi bạn lưu lại tại đây.
        </p>
      </div>

      {/* Legacy data review banner (when combo template was modified after attachment prior to migration) */}
      {needsLegacyReview && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Cấu hình thiết bị cũ cần kiểm tra lại
            </p>
            <p className="text-amber-800">
              Gói thiết bị của tour này được tạo trước khi nâng cấp nhiều combo và combo mẫu gốc đã
              thay đổi sau khi gắn vào tour. Hệ thống giữ nguyên toàn bộ món và giá gốc dưới gói hiện
              tại thay vì tự đoán tách món lẻ. Hãy bấm <strong>"Thay đổi cấu hình"</strong> để chọn
              lại rõ ràng các combo và thiết bị lẻ nếu cần.
            </p>
          </div>
        </div>
      )}

      {/* Stale version / concurrent modification conflict banner */}
      {conflictMessage && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 text-xs sm:text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-900">Phát hiện xung đột phiên bản cấu hình</p>
              <p className="text-xs text-amber-800">{conflictMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReloadLatestConfig}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tải lại cấu hình mới nhất</span>
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="py-12 text-center text-stone-500 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#1F4E43] mx-auto" />
          <p className="text-xs">Đang tải cấu hình thiết bị của tour...</p>
        </div>
      ) : error && !isEditing ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadAllData(false)}
            className="underline font-semibold"
          >
            Thử lại
          </button>
        </div>
      ) : !isEditing ? (
        /* READ-ONLY VIEW */
        <div className="space-y-6">
          {!hasEquipment ? (
            <div className="py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-3">
              <Boxes className="w-10 h-10 text-stone-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-stone-700">
                  Tour chưa được gán thiết bị nào
                </h3>
                <p className="text-xs text-stone-400 max-w-md mx-auto">
                  Khách tham gia chuyến đi sẽ tự chuẩn bị toàn bộ đồ dùng cá nhân, hoặc bạn có thể
                  gắn thêm các gói combo và thiết bị lẻ để hỗ trợ khách thuê.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gán thiết bị cho tour</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Attached Combos Section */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#1F4E43]" />
                  <span>Danh sách combo thiết bị ({savedPackages.length} gói)</span>
                </h4>

                {savedPackages.length === 0 ? (
                  <p className="text-xs italic text-stone-400 py-1">
                    Tour chưa chọn gói combo trọn gói nào.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {savedPackages.map((pkg) => {
                      const templateMatch = packages.find((p) => p.id === pkg.packageTemplateId);
                      const comboItems =
                        pkg.items && pkg.items.length > 0
                          ? pkg.items
                          : templateMatch?.items ?? [];
                      const templateDiffers = hasTemplateChangedSinceSnapshot(pkg, templateMatch);

                      return (
                        <div
                          key={pkg.id}
                          className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2 border-b border-emerald-100 pb-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-[#1F4E43] text-white flex items-center justify-center shrink-0">
                                  <Package className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-sm font-bold text-stone-900 truncate">
                                    {pkg.title}
                                  </h5>
                                  {pkg.needsReview && (
                                    <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded mt-0.5">
                                      Cần rà soát dữ liệu cũ
                                    </span>
                                  )}
                                  {!pkg.needsReview && templateDiffers && (
                                    <span className="inline-block text-[10px] font-medium text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded mt-0.5">
                                      Combo mẫu trong kho đã thay đổi (tour giữ cấu hình lúc gắn)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <strong className="text-xs sm:text-sm font-bold text-[#1F4E43] font-mono">
                                  {pkg.rentalPriceVnd != null
                                    ? formatVND(pkg.rentalPriceVnd)
                                    : 'Miễn phí'}
                                </strong>
                                <span className="text-[10px] text-stone-500 block">/ combo</span>
                              </div>
                            </div>

                            {comboItems.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {comboItems.map((item) => (
                                  <span
                                    key={item.equipmentId}
                                    className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[11px] text-stone-700 font-medium"
                                  >
                                    {item.name} × {item.quantityInPackage ?? 1}
                                  </span>
                                ))}
                              </div>
                            ) : pkg.includedItems ? (
                              <p className="text-xs text-stone-700">
                                <span className="font-semibold text-stone-900">Thành phần: </span>
                                <span>{pkg.includedItems}</span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Attached Individual Equipment */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#1F4E43]" />
                  <span>
                    Danh sách thiết bị lẻ cho thuê ({savedIndividualItems.length} món)
                  </span>
                </h4>

                {savedIndividualItems.length === 0 ? (
                  <p className="text-xs italic text-stone-400 py-1">
                    Tour chưa chọn thiết bị lẻ nào.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {savedIndividualItems.map((item) => {
                      const catItem = catalog.find((c) => c.id === item.equipmentId);
                      const price =
                        item.individualRentalPriceVnd ?? catItem?.individualRentalPriceVnd;
                      return (
                        <div
                          key={item.id ?? item.equipmentId}
                          className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between gap-3 text-xs shadow-2xs"
                        >
                          <div className="truncate">
                            <p className="font-semibold text-stone-900 truncate">
                              {item.name || catItem?.name || 'Thiết bị lẻ'}
                            </p>
                            {item.description || catItem?.description ? (
                              <p className="text-[11px] text-stone-500 truncate">
                                {item.description || catItem?.description}
                              </p>
                            ) : (
                              <p className="text-[11px] text-stone-400">Thiết bị thuê lẻ</p>
                            )}
                          </div>
                          <span className="font-mono font-bold text-[#1F4E43] shrink-0">
                            {price != null ? formatVND(price) : 'Chưa thiết lập'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Quick Unlink Button */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleUnlinkAll}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-rose-50 text-stone-600 hover:text-rose-600 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Gỡ toàn bộ thiết bị khỏi tour này"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Gỡ toàn bộ khỏi tour</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* EDIT CONFIGURATION MODE */
        <div className="space-y-6 pt-2">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Selection Summary & Clear All */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs">
            <div className="text-stone-700">
              Đang chọn:{' '}
              <strong className="text-[#1F4E43]">{selectedPackageIds.length} combo</strong> và{' '}
              <strong className="text-[#1F4E43]">{selectedEquipmentIds.length} thiết bị lẻ</strong>
            </div>
            {(selectedPackageIds.length > 0 || selectedEquipmentIds.length > 0) && (
              <button
                type="button"
                onClick={handleClearAllSelections}
                className="text-xs font-semibold text-rose-600 hover:underline inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Bỏ chọn tất cả</span>
              </button>
            )}
          </div>

          {/* 1. Pick Combo Packages (Multi-select Checkboxes) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                  1. Chọn combo thiết bị ({selectedPackageIds.length} đã chọn)
                </label>
                <p className="text-[11px] text-stone-500">
                  Có thể đánh dấu chọn nhiều gói combo thiết bị cho chuyến đi này.
                </p>
              </div>
              {selectedPackageIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPackageIds([])}
                  className="text-xs text-stone-600 hover:text-rose-600 hover:underline flex items-center gap-1 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Bỏ chọn combo</span>
                </button>
              )}
            </div>

            {packages.length === 0 ? (
              <p className="text-xs italic text-stone-400 py-3">
                Thư viện chưa có gói combo thiết bị nào.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {packages.map((pkg) => {
                  const isSelected = selectedPackageIds.includes(pkg.id);
                  return (
                    <label
                      key={pkg.id}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#1F4E43] bg-emerald-50/50 ring-1 ring-[#1F4E43] shadow-2xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTogglePackage(pkg.id)}
                              className="mt-0.5 rounded text-[#1F4E43] focus:ring-[#1F4E43] w-4 h-4 cursor-pointer shrink-0"
                            />
                            <span className="font-bold text-stone-900 text-sm leading-snug line-clamp-1">
                              {pkg.title}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#1F4E43] shrink-0">
                            {pkg.rentalPriceVnd != null ? formatVND(pkg.rentalPriceVnd) : 'Miễn phí'}
                          </span>
                        </div>

                        {pkg.items && pkg.items.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {pkg.items.map((item) => (
                              <span
                                key={item.equipmentId}
                                className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px] text-stone-700"
                              >
                                {item.name} × {item.quantityInPackage}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-stone-400 italic">Chưa có món trong gói</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Pick Individual Equipment (Multi-select Checkboxes, NOT disabled when in combo) */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                  2. Chọn thiết bị lẻ ({selectedEquipmentIds.length} đã chọn)
                </label>
                <p className="text-[11px] text-stone-500">
                  Có thể chọn nhiều món lẻ. Những món đã xuất hiện trong combo vẫn có thể được chọn
                  để cung cấp thuê lẻ.
                </p>
              </div>
              {selectedEquipmentIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedEquipmentIds([])}
                  className="text-xs text-stone-600 hover:text-rose-600 hover:underline flex items-center gap-1 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Bỏ chọn món lẻ</span>
                </button>
              )}
            </div>

            {catalog.length === 0 ? (
              <p className="text-xs italic text-stone-400 py-3">
                Thư viện chưa có thiết bị lẻ nào.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto p-1">
                {catalog.map((item) => {
                  const isInSelectedCombo = packageItemIds.has(item.id);
                  const isChecked = selectedEquipmentIds.includes(item.id);
                  const isAvailableForIndividual = item.individualRentalPriceVnd != null;

                  return (
                    <label
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-all ${
                        !isAvailableForIndividual
                          ? 'border-dashed border-amber-200 bg-amber-50/40 text-stone-400 cursor-not-allowed opacity-75'
                          : isChecked
                          ? 'border-[#1F4E43] bg-emerald-50/50 text-stone-900 cursor-pointer ring-1 ring-[#1F4E43]'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          disabled={!isAvailableForIndividual}
                          checked={isChecked && isAvailableForIndividual}
                          onChange={() => handleToggleEquipment(item.id)}
                          className="rounded text-[#1F4E43] focus:ring-[#1F4E43] w-4 h-4 cursor-pointer disabled:cursor-not-allowed shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{item.name}</p>
                          <p className="text-[10px] text-stone-500 truncate">
                            {!isAvailableForIndividual
                              ? 'Chưa thiết lập giá lẻ'
                              : isInSelectedCombo
                              ? 'Có trong combo đã chọn • Vẫn có thể thuê lẻ'
                              : item.description || 'Thiết bị thuê lẻ'}
                          </p>
                        </div>
                      </div>

                      <span className="font-mono text-[11px] font-semibold text-[#1F4E43] shrink-0">
                        {item.individualRentalPriceVnd != null
                          ? formatVND(item.individualRentalPriceVnd)
                          : 'Chưa thiết lập'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Hủy thay đổi
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-2xs transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin text-[#B9EADB]" />}
              <span>{isSaving ? 'Đang lưu cấu hình...' : 'Lưu thiết bị cho tour'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
