import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Upload,
  Info,
  X,
  Layers,
} from 'lucide-react';
import { equipmentApi } from '../../../features/equipment/api/equipment.api';
import type {
  RentalPackageTemplate,
  SaveRentalPackageRequest,
  EquipmentCatalogItem,
} from '../../../features/equipment/types/equipment.types';
import { formatVND } from '../../../lib/utils';
import { toast } from '../../../components/ui/Toast';

export const EquipmentPackagesTab: React.FC = () => {
  const [packages, setPackages] = useState<RentalPackageTemplate[]>([]);
  const [catalog, setCatalog] = useState<EquipmentCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingPackage, setEditingPackage] = useState<RentalPackageTemplate | null>(null);
  const [deletePackageTarget, setDeletePackageTarget] = useState<RentalPackageTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pkgs, catItems] = await Promise.all([
        equipmentApi.listPackages(),
        equipmentApi.listCatalog(),
      ]);
      setPackages(pkgs);
      setCatalog(catItems.filter((item) => item.status === 'ACTIVE'));
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Không thể tải danh sách combo thiết bị.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    if (!searchQuery.trim()) return packages;
    const q = searchQuery.toLowerCase().trim();
    return packages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.items.some((i) => i.name?.toLowerCase().includes(q))
    );
  }, [packages, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPackage(null);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (pkg: RentalPackageTemplate) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletePackageTarget) return;
    setIsDeleting(true);
    try {
      await equipmentApi.deletePackage(deletePackageTarget.id);
      toast.success(`Đã xóa combo "${deletePackageTarget.title}"`);
      setDeletePackageTarget(null);
      await fetchData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || 'Không thể xóa combo thiết bị này.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold">Lưu ý về combo mẫu</p>
          <p className="text-amber-800">
            Chỉnh sửa hoặc xóa combo mẫu sẽ không tự động làm thay đổi cấu hình của những tour đã
            gắn combo trước đó. Mỗi tour khi đính kèm combo sẽ giữ bản chụp cấu hình độc lập cho
            đến khi quản trị viên lưu lại mục thiết bị trong trang chỉnh sửa tour.
          </p>
        </div>
      </div>

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên combo hoặc món trong combo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-stone-200 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1F4E43] focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo combo mới</span>
          </button>
        </div>
      </div>

      {/* Content list */}
      {isLoading ? (
        <div className="py-16 text-center text-stone-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1F4E43] mx-auto" />
          <p className="text-sm">Đang tải danh sách combo thiết bị...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-stone-200 space-y-3">
          <Package className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-semibold text-stone-700">
            {searchQuery ? 'Không tìm thấy combo phù hợp' : 'Chưa có combo thiết bị nào'}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Thử thay đổi từ khóa tìm kiếm.'
              : 'Hãy bấm nút "Tạo combo mới" để nhóm các thiết bị lẻ thành một gói thuê trọn vẹn cho tour.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 rounded-xl bg-[#1F4E43] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo combo đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={() => handleOpenEdit(pkg)}
              onDelete={() => setDeletePackageTarget(pkg)}
              onRefresh={fetchData}
            />
          ))}
        </div>
      )}

      {/* Package Form Modal */}
      {isFormOpen && (
        <PackageFormModal
          isOpen={isFormOpen}
          initialData={editingPackage}
          catalog={catalog}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletePackageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-stone-900">Xóa combo thiết bị?</h3>
              <p className="text-sm text-stone-600">
                Bạn có chắc chắn muốn xóa combo{' '}
                <strong className="text-stone-800">"{deletePackageTarget.title}"</strong>?
              </p>
              <p className="text-xs text-stone-500 pt-1">
                Lưu ý: Thao tác này chỉ xóa gói combo mẫu trong thư viện dùng chung. Các tour đã gắn
                combo này trước đó vẫn giữ nguyên dữ liệu.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletePackageTarget(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* PACKAGE CARD COMPONENT                                                    */
/* ========================================================================= */

interface PackageCardProps {
  pkg: RentalPackageTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, onEdit, onDelete, onRefresh }) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      await equipmentApi.uploadPackageImage(pkg.id, file);
      toast.success('Đã tải ảnh lên cho combo');
      onRefresh();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || 'Không thể tải ảnh lên.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh đại diện của combo này?')) return;
    setIsDeletingImage(true);
    try {
      await equipmentApi.deletePackageImage(pkg.id);
      toast.success('Đã xóa ảnh combo');
      onRefresh();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message || 'Không thể xóa ảnh.');
    } finally {
      setIsDeletingImage(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col">
      {/* Image Banner */}
      <div className="relative h-44 bg-stone-100 group overflow-hidden">
        {pkg.imageUrl ? (
          <img
            src={pkg.imageUrl}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-1.5 bg-[#FAF8F5]">
            <Package className="w-10 h-10 text-stone-300" />
            <span className="text-xs">Chưa có ảnh đại diện</span>
          </div>
        )}

        {/* Floating Item Count Badge */}
        <div className="absolute top-3 left-3 bg-[#1C2526]/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
          <Layers className="w-3 h-3 text-[#B9EADB]" />
          <span>{pkg.items?.length || 0} món</span>
        </div>

        {/* Quick Image Action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 hover:opacity-100">
          <label
            className={`p-1.5 rounded-lg bg-white/90 hover:bg-white text-stone-700 shadow-xs cursor-pointer transition-colors ${
              isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Tải ảnh mới"
          >
            {isUploadingImage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1F4E43]" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <input
              type="file"
              accept="image/*"
              disabled={isUploadingImage}
              onChange={handleUploadImage}
              className="hidden"
            />
          </label>
          {pkg.imageUrl && (
            <button
              type="button"
              disabled={isDeletingImage}
              onClick={handleDeleteImage}
              className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-rose-600 shadow-xs transition-colors cursor-pointer"
              title="Xóa ảnh"
            >
              {isDeletingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col space-y-4">
        {/* Title & Price */}
        <div>
          <h3 className="font-bold text-stone-900 text-base leading-snug">{pkg.title}</h3>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-[#1F4E43]">
              {pkg.rentalPriceVnd != null ? formatVND(pkg.rentalPriceVnd) : 'Chưa thiết lập'}
            </span>
            <span className="text-xs text-stone-500">/ trọn chuyến</span>
          </div>
        </div>

        {/* Items List Preview */}
        <div className="space-y-1.5 flex-1">
          <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
            Các món trong combo:
          </p>
          {pkg.items && pkg.items.length > 0 ? (
            <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100 max-h-36 overflow-y-auto space-y-1.5 text-xs">
              {pkg.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-stone-700">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1F4E43]" />
                    <span className="truncate">{item.name || `Thiết bị #${item.equipmentId}`}</span>
                  </div>
                  <span className="font-semibold text-stone-900 shrink-0 ml-2">
                    x{item.quantityInPackage}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-stone-400">Chưa chọn món nào trong combo.</p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-stone-500" />
            <span>Chỉnh sửa</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa combo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* PACKAGE CREATE / EDIT MODAL                                               */
/* ========================================================================= */

interface PackageFormModalProps {
  isOpen: boolean;
  initialData: RentalPackageTemplate | null;
  catalog: EquipmentCatalogItem[];
  onClose: () => void;
  onSuccess: () => void;
}

interface DraftPackageItem {
  equipmentId: number;
  quantityInPackage: number;
  individualRentalPriceVnd?: number | null;
}

const PackageFormModal: React.FC<PackageFormModalProps> = ({
  initialData,
  catalog,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title || '');
  const [rentalPriceVnd, setRentalPriceVnd] = useState<number | string>(
    initialData?.rentalPriceVnd != null ? initialData.rentalPriceVnd : ''
  );
  const [items, setItems] = useState<DraftPackageItem[]>(() => {
    if (initialData?.items && initialData.items.length > 0) {
      return initialData.items.map((i) => ({
        equipmentId: i.equipmentId,
        quantityInPackage: i.quantityInPackage || 1,
        individualRentalPriceVnd: i.individualRentalPriceVnd,
      }));
    }
    return [];
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialData?.imageUrl || null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Clean preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Handle local image file pick
  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  // Add equipment item to package
  const handleAddItem = (equipmentId: number) => {
    if (!equipmentId) return;
    if (items.some((i) => i.equipmentId === equipmentId)) {
      toast.error('Thiết bị này đã có trong combo!');
      return;
    }
    const catItem = catalog.find((c) => c.id === equipmentId);
    setItems((prev) => [
      ...prev,
      {
        equipmentId,
        quantityInPackage: 1,
        individualRentalPriceVnd: catItem?.individualRentalPriceVnd,
      },
    ]);
  };

  // Remove item
  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update item quantity
  const handleUpdateQuantity = (idx: number, qty: number) => {
    const safeQty = Math.max(1, qty);
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantityInPackage: safeQty } : item))
    );
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Vui lòng nhập tên combo.');
      return;
    }

    const priceNum = rentalPriceVnd === '' ? 0 : Number(rentalPriceVnd);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Giá thuê trọn chuyến phải là số lớn hơn hoặc bằng 0.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: SaveRentalPackageRequest = {
      title: title.trim(),
      rentalPriceVnd: priceNum,
      items: items.map((i) => ({
        equipmentId: i.equipmentId,
        quantityInPackage: i.quantityInPackage,
        individualRentalPriceVnd: i.individualRentalPriceVnd,
      })),
    };

    try {
      let savedPkg: RentalPackageTemplate;
      if (isEdit && initialData) {
        savedPkg = await equipmentApi.updatePackage(initialData.id, payload);
        toast.success(`Đã cập nhật combo "${savedPkg.title}"`);
      } else {
        savedPkg = await equipmentApi.createPackage(payload);
        toast.success(`Đã tạo combo "${savedPkg.title}" thành công`);
      }

      // Step 2: Upload image if chosen
      if (selectedImageFile && savedPkg.id) {
        try {
          await equipmentApi.uploadPackageImage(savedPkg.id, selectedImageFile);
          toast.success('Đã tải ảnh đại diện combo lên');
        } catch {
          toast.error(
            'Combo đã được lưu, nhưng tải ảnh đại diện thất bại. Bạn có thể tải lại ảnh sau.'
          );
        }
      }

      onSuccess();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setFormError(apiErr?.message || 'Có lỗi xảy ra khi lưu combo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Available catalog items not yet in combo
  const unselectedCatalog = catalog.filter(
    (c) => !items.some((item) => item.equipmentId === c.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1F4E43]/10 text-[#1F4E43] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                {isEdit ? 'Chỉnh sửa combo thiết bị' : 'Tạo combo thiết bị mới'}
              </h3>
              <p className="text-xs text-stone-500">
                Tập hợp các món thiết bị trekking thành một gói thuê đồng bộ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isEdit && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2 shrink-0">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý:</strong> Sửa combo mẫu không tự động thay đổi cấu hình của những tour đã
              gắn combo này trước đó. Để áp dụng thành phần hoặc giá mới cho một tour, hãy mở trang
              chỉnh sửa tour đó và lưu lại mục Thiết bị cho tour.
            </span>
          </div>
        )}

        {formError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Title & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <span>Tên combo</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Combo Trekking Chuyên Nghiệp (Lều + Túi ngủ + Gậy)..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1F4E43] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <span>Giá thuê cả combo (VND / chuyến)</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  placeholder="0 (Miễn phí hoặc nhập số tiền)"
                  value={rentalPriceVnd}
                  onChange={(e) => setRentalPriceVnd(e.target.value)}
                  className="w-full pl-3.5 pr-12 py-2 text-sm rounded-xl border border-stone-200 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1F4E43] focus:border-transparent transition-all font-mono"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-500">
                  VND
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Giá thuê trọn gói cho toàn bộ chuyến đi (0 VND là hợp lệ).
              </p>
            </div>
          </div>

          {/* Image Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Ảnh đại diện combo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border border-stone-200 bg-stone-50 overflow-hidden flex items-center justify-center relative shrink-0">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-8 h-8 text-stone-300" />
                )}
              </div>
              <div className="space-y-1.5">
                <label className="px-3.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{imagePreviewUrl ? 'Thay đổi ảnh' : 'Chọn ảnh từ máy'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePickImage}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-stone-500">Hỗ trợ JPG, PNG, WebP (tối đa 5MB)</p>
              </div>
            </div>
          </div>

          {/* Package Items Selector */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                  Danh sách món trong combo ({items.length})
                </label>
                <p className="text-[11px] text-stone-500">
                  Chọn các thiết bị lẻ có sẵn và gán số lượng tương ứng
                </p>
              </div>

              {/* Add item dropdown */}
              <div className="flex items-center gap-2">
                <select
                  aria-label="Chọn thiết bị để thêm vào combo"
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) {
                      handleAddItem(id);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F4E43] font-medium"
                >
                  <option value="" disabled>
                    + Thêm thiết bị vào combo...
                  </option>
                  {unselectedCatalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-stone-50 border border-dashed border-stone-200 space-y-1">
                <p className="text-xs text-stone-500">Chưa có thiết bị nào trong combo này.</p>
                <p className="text-[11px] text-stone-400">
                  Dùng danh sách chọn ở góc trên bên phải để thêm món vào combo.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
                {items.map((item, idx) => {
                  const catItem = catalog.find((c) => c.id === item.equipmentId);
                  return (
                    <div
                      key={item.equipmentId}
                      className="p-3 bg-white flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 truncate">
                          {catItem?.name || `Thiết bị #${item.equipmentId}`}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Giá thuê lẻ tham khảo:{' '}
                          <span className="font-mono text-stone-700">
                            {catItem?.individualRentalPriceVnd != null
                              ? formatVND(catItem.individualRentalPriceVnd)
                              : 'Chưa thiết lập'}
                          </span>
                        </p>
                      </div>

                      {/* Quantity Input */}
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 text-[11px]">Số lượng:</span>
                        <input
                          type="number"
                          min="1"
                          aria-label={`Số lượng cho ${catItem?.name || item.equipmentId}`}
                          value={item.quantityInPackage}
                          onChange={(e) =>
                            handleUpdateQuantity(idx, parseInt(e.target.value) || 1)
                          }
                          className="w-16 px-2 py-1 text-center font-mono rounded-lg border border-stone-200 text-xs focus:ring-1 focus:ring-[#1F4E43] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Gỡ món khỏi combo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-2xs transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-[#B9EADB]" />}
            <span>{isSubmitting ? 'Đang lưu combo...' : isEdit ? 'Lưu thay đổi' : 'Tạo combo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
