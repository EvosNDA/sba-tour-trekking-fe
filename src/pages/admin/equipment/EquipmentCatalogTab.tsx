import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Wrench,
  Boxes,
  X,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { equipmentApi } from '../../../features/equipment/api/equipment.api';
import type {
  EquipmentCatalogItem,
  EquipmentInventoryItem,
  EquipmentCategory,
} from '../../../features/equipment/types/equipment.types';
import { formatVND } from '../../../lib/utils';
import { toast } from '../../../components/ui/Toast';

export interface MergedEquipmentItem {
  id: number;
  name: string;
  description: string | null;
  individualRentalPriceVnd: number | null;
  imageUrl: string | null;
  // Inventory details
  categoryId: number | null;
  categoryName: string | null;
  totalQuantity: number;
  maintenanceQuantity: number;
  availableQuantity: number;
  active: boolean;
  hasInventoryRecord: boolean;
}

export const EquipmentCatalogTab: React.FC = () => {
  const [catalogItems, setCatalogItems] = useState<EquipmentCatalogItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<EquipmentInventoryItem[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modal Create / Edit state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MergedEquipmentItem | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [rentalPrice, setRentalPrice] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [totalQuantity, setTotalQuantity] = useState<string>('10');
  const [maintenanceQuantity, setMaintenanceQuantity] = useState<string>('0');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState<boolean>(false);

  // Multi-step lifecycle state for error handling without duplicate creation
  const [createdEquipmentId, setCreatedEquipmentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [stepWarning, setStepWarning] = useState<string | null>(null);

  // Quick category creation inside equipment modal
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);
  const [categoryCreateError, setCategoryCreateError] = useState<string | null>(null);

  // Delete modal state
  const [deletingItem, setDeletingItem] = useState<MergedEquipmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch all related data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [catalogRes, inventoryRes, catRes] = await Promise.all([
        equipmentApi.listCatalog(),
        equipmentApi.listInventory().catch(() => []),
        equipmentApi.listCategories().catch(() => []),
      ]);

      setCatalogItems(catalogRes || []);
      setInventoryItems(inventoryRes || []);
      setCategories(catRes || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh mục thiết bị và tồn kho.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Merge catalog items with inventory items by id
  const mergedList: MergedEquipmentItem[] = useMemo(() => {
    const invMap = new Map<number, EquipmentInventoryItem>();
    inventoryItems.forEach((inv) => invMap.set(inv.id, inv));

    return catalogItems.map((cat) => {
      const inv = invMap.get(cat.id);
      return {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        individualRentalPriceVnd: cat.individualRentalPriceVnd,
        imageUrl: cat.imageUrl,
        categoryId: inv?.categoryId ?? null,
        categoryName: inv?.categoryName ?? null,
        totalQuantity: inv?.totalQuantity ?? 0,
        maintenanceQuantity: inv?.maintenanceQuantity ?? 0,
        availableQuantity: inv?.availableQuantity ?? 0,
        active: inv?.active ?? true,
        hasInventoryRecord: Boolean(inv),
      };
    });
  }, [catalogItems, inventoryItems]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setCreatedEquipmentId(null);
    setName('');
    setDescription('');
    setRentalPrice('');
    setCategoryId(categories[0]?.id ? String(categories[0].id) : '');
    setTotalQuantity('10');
    setMaintenanceQuantity('0');
    setIsActive(true);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setRemoveExistingImage(false);
    setFormError(null);
    setStepWarning(null);
    setIsQuickCategoryOpen(false);
    setNewCategoryName('');
    setCategoryCreateError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MergedEquipmentItem) => {
    setEditingItem(item);
    setCreatedEquipmentId(item.id);
    setName(item.name);
    setDescription(item.description || '');
    setRentalPrice(
      item.individualRentalPriceVnd !== null && item.individualRentalPriceVnd !== undefined
        ? String(item.individualRentalPriceVnd)
        : ''
    );
    setCategoryId(item.categoryId ? String(item.categoryId) : (categories[0]?.id ? String(categories[0].id) : ''));
    setTotalQuantity(String(item.totalQuantity));
    setMaintenanceQuantity(String(item.maintenanceQuantity));
    setIsActive(item.active);
    setSelectedImageFile(null);
    setImagePreviewUrl(item.imageUrl || null);
    setRemoveExistingImage(false);
    setFormError(null);
    setStepWarning(null);
    setIsQuickCategoryOpen(false);
    setNewCategoryName('');
    setCategoryCreateError(null);
    setIsModalOpen(true);
  };

  const handleQuickCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    setCategoryCreateError(null);
    try {
      const created = await equipmentApi.createCategory({
        name: newCategoryName.trim(),
        active: true,
      });
      toast.success(`Đã tạo nhóm "${created.name}"`);
      setCategories((prev) => [...prev, created]);
      setCategoryId(String(created.id));
      setNewCategoryName('');
      setIsQuickCategoryOpen(false);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setCategoryCreateError(apiErr?.message || 'Không thể tạo nhóm thiết bị');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setRemoveExistingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setRemoveExistingImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Vui lòng nhập tên thiết bị.');
      return;
    }

    const priceNum = rentalPrice.trim() === '' ? null : Number(rentalPrice);
    if (priceNum !== null && (isNaN(priceNum) || priceNum < 0)) {
      setFormError('Đơn giá thuê phải là số không âm (>= 0 đ).');
      return;
    }

    const totQty = parseInt(totalQuantity, 10);
    const mainQty = parseInt(maintenanceQuantity, 10);
    if (isNaN(totQty) || totQty < 0) {
      setFormError('Tổng số lượng trong kho không hợp lệ.');
      return;
    }
    if (isNaN(mainQty) || mainQty < 0) {
      setFormError('Số lượng bảo trì không hợp lệ.');
      return;
    }
    if (mainQty > totQty) {
      setFormError('Số lượng bảo trì không thể lớn hơn tổng số lượng trong kho.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setStepWarning(null);

    let activeEquipmentId = createdEquipmentId || editingItem?.id || null;

    try {
      // Step 1: Create or update catalog item
      if (!activeEquipmentId) {
        const created = await equipmentApi.createEquipment({
          name: name.trim(),
          description: description.trim() || null,
          individualRentalPriceVnd: priceNum,
        });
        activeEquipmentId = created.id;
        setCreatedEquipmentId(created.id);
      } else if (editingItem) {
        await equipmentApi.updateEquipment(activeEquipmentId, {
          name: name.trim(),
          description: description.trim() || null,
          individualRentalPriceVnd: priceNum,
        });
      }

      // Step 2: Update inventory (if category is chosen)
      if (activeEquipmentId && categoryId) {
        try {
          await equipmentApi.updateInventory(activeEquipmentId, {
            categoryId: Number(categoryId),
            totalQuantity: totQty,
            maintenanceQuantity: mainQty,
            active: isActive,
          });
        } catch (invErr: any) {
          setStepWarning(
            `Thiết bị đã được lưu nhưng cập nhật tồn kho thất bại: ${
              invErr?.message || 'Lỗi kho'
            }. Bạn có thể bấm lưu lại để hoàn tất.`
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Step 3: Handle image upload or delete
      if (activeEquipmentId) {
        if (selectedImageFile) {
          try {
            await equipmentApi.uploadEquipmentImage(activeEquipmentId, selectedImageFile);
          } catch (imgErr: any) {
            setStepWarning(
              `Thiết bị và tồn kho đã được lưu nhưng tải ảnh thất bại: ${
                imgErr?.message || 'Lỗi tải ảnh'
              }. Bạn có thể thử tải ảnh lại.`
            );
            setIsSubmitting(false);
            return;
          }
        } else if (removeExistingImage && editingItem?.imageUrl) {
          try {
            await equipmentApi.deleteEquipmentImage(activeEquipmentId);
          } catch {
            // Ignore image deletion error
          }
        }
      }

      toast.success(
        editingItem ? `Đã cập nhật thiết bị "${name.trim()}" thành công!` : `Đã tạo thiết bị "${name.trim()}" thành công!`
      );
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err?.message || 'Có lỗi xảy ra khi lưu thiết bị.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await equipmentApi.deleteEquipment(deletingItem.id);
      toast.success(`Đã xóa thiết bị "${deletingItem.name}" thành công!`);
      setDeletingItem(null);
      fetchData();
    } catch (err: any) {
      setDeleteError(
        err?.message ||
          'Không thể xóa thiết bị này vì có thể đang được gắn vào tour hoặc combo. Vui lòng gỡ liên kết trước khi xóa.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return mergedList.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchCategory =
        selectedCategoryFilter === 'ALL' ||
        String(item.categoryId) === selectedCategoryFilter;

      const matchStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ACTIVE' && item.active) ||
        (selectedStatusFilter === 'INACTIVE' && !item.active);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [mergedList, searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-[#E6E1D8] shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm theo tên thiết bị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-[#1F4E43] focus:ring-1 focus:ring-[#1F4E43] outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-stone-400 shrink-0 hidden sm:block" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-700 bg-white focus:border-[#1F4E43] outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả nhóm</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-700 bg-white focus:border-[#1F4E43] outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái kho</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-[#F7F4EE] transition-colors cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thiết bị mới</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#E6E1D8] p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1F4E43] mx-auto" />
          <p className="text-sm text-stone-500 font-medium">Đang tải danh mục thiết bị & dữ liệu kho...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F4E43] text-white text-xs font-semibold hover:bg-[#15372F] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Table / List */}
      {!isLoading && !error && (
        <div className="bg-white rounded-2xl border border-[#E6E1D8] overflow-hidden shadow-2xs">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F4EE] border border-[#E6E1D8] flex items-center justify-center text-[#1F4E43] mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-[#1C2526]">
                {searchQuery || selectedCategoryFilter !== 'ALL' || selectedStatusFilter !== 'ALL'
                  ? 'Không tìm thấy thiết bị phù hợp bộ lọc'
                  : 'Chưa có thiết bị nào trong danh mục'}
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc nhóm thiết bị.'
                  : 'Hãy thêm các thiết bị lẻ (lều, túi ngủ, gậy trekking...) để quản lý tồn kho và đưa vào combo tour.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F4E43] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm thiết bị ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF8F5] border-b border-[#E6E1D8] text-xs font-semibold uppercase tracking-wider text-stone-600">
                  <tr>
                    <th className="py-3.5 px-6">Thiết bị</th>
                    <th className="py-3.5 px-4">Nhóm</th>
                    <th className="py-3.5 px-4">Giá thuê lẻ</th>
                    <th className="py-3.5 px-4 text-center">Tồn kho (Tổng / Bảo trì / Khả dụng)</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      {/* Name & Photo */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-stone-400" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#1C2526] block text-sm sm:text-base">
                              {item.name}
                            </span>
                            {item.description && (
                              <p className="text-xs text-stone-500 line-clamp-1 max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 text-xs font-medium text-stone-700">
                        {item.categoryName ? (
                          <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E6E1D8] text-stone-800">
                            {item.categoryName}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Chưa phân nhóm</span>
                        )}
                      </td>

                      {/* Rental Price */}
                      <td className="py-4 px-4">
                        {item.individualRentalPriceVnd !== null &&
                        item.individualRentalPriceVnd !== undefined ? (
                          <span className="font-bold text-[#C2410C] text-sm">
                            {formatVND(item.individualRentalPriceVnd)}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs italic">Chưa thiết lập</span>
                        )}
                      </td>

                      {/* Inventory Count (Total / Maintenance / Available) */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-2 p-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1D8] text-xs">
                          <span className="font-semibold text-stone-800" title="Tổng số lượng">
                            Tổng: <strong>{item.totalQuantity}</strong>
                          </span>
                          <span className="text-stone-300">|</span>
                          <span className="text-amber-700" title="Đang bảo trì">
                            Bảo trì: <strong>{item.maintenanceQuantity}</strong>
                          </span>
                          <span className="text-stone-300">|</span>
                          <span className="text-emerald-700 font-bold" title="Khả dụng">
                            Khả dụng: <strong>{item.availableQuantity}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="py-4 px-4">
                        {item.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                            <XCircle className="w-3 h-3" />
                            <span>Tạm ngưng</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 rounded-lg text-stone-500 hover:text-[#1F4E43] hover:bg-[#F7F4EE] transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin & kho"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingItem(item);
                              setDeleteError(null);
                            }}
                            className="p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa thiết bị"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Tạo / Chỉnh sửa Thiết bị & Tồn kho */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E6E1D8] space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-lg text-[#1C2526]">
                {editingItem ? 'Chỉnh sửa thiết bị & kho' : 'Thêm thiết bị mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {stepWarning && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>{stepWarning}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#1C2526] mb-1.5">
                  Tên thiết bị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  required
                  placeholder="Ví dụ: Lều 2 người Naturehike, Gậy trekking Black Diamond..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-[#1F4E43] focus:ring-1 focus:ring-[#1F4E43] outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#1C2526] mb-1.5">
                  Mô tả / Thông số kỹ thuật
                </label>
                <textarea
                  rows={2}
                  placeholder="Trọng lượng, kích thước, khả năng chống nước..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-[#1F4E43] focus:ring-1 focus:ring-[#1F4E43] outline-none resize-none"
                />
              </div>

              {/* Rental Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                <div>
                  <label className="block text-xs font-bold text-[#1C2526] mb-1.5">
                    Giá thuê lẻ (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Để trống nếu chưa thiết lập"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-[#1F4E43] focus:ring-1 focus:ring-[#1F4E43] outline-none font-mono"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    0 đ là giá hợp lệ (miễn phí)
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#1C2526]">
                      Nhóm thiết bị
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickCategoryOpen((prev) => !prev);
                        setCategoryCreateError(null);
                      }}
                      className="text-[11px] font-semibold text-[#1F4E43] hover:text-[#15372F] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isQuickCategoryOpen ? 'Đóng tạo nhóm' : 'Tạo nhóm mới'}</span>
                    </button>
                  </div>

                  {/* Inline quick category creation box */}
                  {isQuickCategoryOpen && (
                    <div className="mb-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#1F4E43]/30 space-y-2.5 animate-in fade-in duration-150 shadow-xs">
                      <div className="flex items-center justify-between text-xs text-[#1C2526]">
                        <span className="font-bold">Tạo nhóm thiết bị mới</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickCategoryOpen(false);
                            setNewCategoryName('');
                            setCategoryCreateError(null);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-200/50 cursor-pointer"
                          title="Đóng"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Nhập tên nhóm (VD: Lều trại, Balo...)"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickCreateCategory();
                          }
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1F4E43] focus:border-[#1F4E43]"
                        autoFocus
                      />

                      <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isCreatingCategory}
                            onClick={() => {
                              setIsQuickCategoryOpen(false);
                              setNewCategoryName('');
                              setCategoryCreateError(null);
                            }}
                            className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            disabled={isCreatingCategory || !newCategoryName.trim()}
                            onClick={handleQuickCreateCategory}
                            className="px-3.5 py-1.5 text-xs rounded-lg bg-[#1F4E43] hover:bg-[#15372F] text-white font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                          >
                            {isCreatingCategory ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>Lưu</span>
                          </button>
                      </div>

                      {categoryCreateError && (
                        <p className="text-[11px] text-red-600 font-medium">{categoryCreateError}</p>
                      )}
                    </div>
                  )}

                  <select
                    value={categoryId}
                    onChange={(e) => {
                      if (e.target.value === '__CREATE_NEW__') {
                        setIsQuickCategoryOpen(true);
                      } else {
                        setCategoryId(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-[#1F4E43] focus:ring-1 focus:ring-[#1F4E43] outline-none bg-white cursor-pointer"
                  >
                    <option value="">-- Chưa chọn nhóm --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__CREATE_NEW__" className="text-[#1F4E43] font-semibold bg-emerald-50">
                      + Thêm nhóm mới vào danh sách...
                    </option>
                  </select>
                </div>
              </div>

              {/* Inventory Quantities */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D8] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1C2526]">
                  <Boxes className="w-4 h-4 text-[#1F4E43]" />
                  <span>Quản lý số lượng tồn kho</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      Tổng số lượng có
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:border-[#1F4E43] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      Đang bảo trì / hỏng
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={maintenanceQuantity}
                      onChange={(e) => setMaintenanceQuantity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:border-[#1F4E43] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-stone-600">Số lượng khả dụng ước tính:</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {Math.max(0, (parseInt(totalQuantity, 10) || 0) - (parseInt(maintenanceQuantity, 10) || 0))} món
                  </span>
                </div>
              </div>

              {/* Image Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1C2526]">
                  Hình ảnh thiết bị
                </label>
                {imagePreviewUrl ? (
                  <div className="relative w-32 h-24 rounded-xl border border-stone-200 overflow-hidden group">
                    <img
                      src={imagePreviewUrl}
                      alt="Xem trước ảnh thiết bị"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-red-600 transition-colors cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-stone-200 hover:border-[#1F4E43] rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#FAF8F5]/50">
                    <UploadCloud className="w-6 h-6 text-stone-400 mb-1" />
                    <span className="text-xs font-semibold text-[#1F4E43]">
                      Tải ảnh từ máy tính (JPG, PNG, WebP)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1D8]">
                <div>
                  <span className="text-xs font-bold text-[#1C2526] block">Trạng thái kho</span>
                  <span className="text-[11px] text-stone-500 block">
                    Đang sẵn sàng cho tour thuê
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F4E43]"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Lưu thay đổi' : 'Thêm thiết bị'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa Thiết bị */}
      {deletingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-bold text-lg text-[#1C2526]">Xác nhận xóa thiết bị</h3>
              <p className="text-xs text-stone-600">
                Bạn có chắc chắn muốn xóa thiết bị <strong className="text-stone-900">"{deletingItem.name}"</strong> khỏi thư viện dùng chung?
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xóa vĩnh viễn</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
