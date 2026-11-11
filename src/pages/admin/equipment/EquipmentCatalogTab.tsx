import { Modal } from '../../../components/ui/Modal';
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
  RentalPackageTemplate,
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

type EquipmentCatalogTabProps = { onRegisterCreateAction?: (action: () => void) => void };

export const EquipmentCatalogTab: React.FC<EquipmentCatalogTabProps> = ({ onRegisterCreateAction }) => {
  const [catalogItems, setCatalogItems] = useState<EquipmentCatalogItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<EquipmentInventoryItem[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [rentalPackages, setRentalPackages] = useState<RentalPackageTemplate[]>([]);

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
      const [catalogRes, inventoryRes, catRes, packageRes] = await Promise.all([
        equipmentApi.listCatalog(),
        equipmentApi.listInventory().catch(() => []),
        equipmentApi.listCategories().catch(() => []),
        equipmentApi.listPackages().catch(() => []),
      ]);

      setCatalogItems(catalogRes || []);
      setInventoryItems(inventoryRes || []);
      setCategories(catRes || []);
      setRentalPackages(packageRes || []);
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
        active: cat.status === 'ACTIVE',
        hasInventoryRecord: Boolean(inv),
      };
    });
  }, [catalogItems, inventoryItems]);

  const handleOpenCreateModal = useCallback(() => {
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
  }, [categories]);

  useEffect(() => {
    onRegisterCreateAction?.(handleOpenCreateModal);
  }, [handleOpenCreateModal, onRegisterCreateAction]);

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
          status: isActive ? 'ACTIVE' : 'MAINTENANCE',
        });
        activeEquipmentId = created.id;
        setCreatedEquipmentId(created.id);
      } else if (editingItem) {
        await equipmentApi.updateEquipment(activeEquipmentId, {
          name: name.trim(),
          description: description.trim() || null,
          individualRentalPriceVnd: priceNum,
          status: isActive ? 'ACTIVE' : 'MAINTENANCE',
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
          'Không thể xóa thiết bị. Vui lòng thử lại.'
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
    <div className="equipment-catalog-layout grid items-start gap-5">
      <div className="min-w-0 space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-[#E0E6EE] shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên thiết bị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0B7058] focus:ring-1 focus:ring-[#0B7058] outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:border-[#0B7058] outline-none cursor-pointer"
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
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white focus:border-[#0B7058] outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Bảo trì</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-[#F3F6FA] transition-colors cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#E0E6EE] p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B7058] mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Đang tải danh mục thiết bị & dữ liệu kho...</p>
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B7058] text-white text-xs font-semibold hover:bg-[#075743] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Table / List */}
      {!isLoading && !error && (
        <div className="bg-white rounded-2xl border border-[#E0E6EE] overflow-hidden shadow-2xs">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F3F6FA] border border-[#E0E6EE] flex items-center justify-center text-[#0B7058] mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-[#172033]">
                {searchQuery || selectedCategoryFilter !== 'ALL' || selectedStatusFilter !== 'ALL'
                  ? 'Không tìm thấy thiết bị phù hợp bộ lọc'
                  : 'Chưa có thiết bị nào trong danh mục'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc nhóm thiết bị.'
                  : 'Hãy thêm các thiết bị lẻ (lều, túi ngủ, gậy trekking...) để quản lý tồn kho và đưa vào combo tour.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B7058] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm thiết bị ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF8F5] border-b border-[#E0E6EE] text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">Thiết bị</th>
                    <th className="py-3.5 px-2.5 whitespace-nowrap">Danh mục</th>
                    <th className="py-3.5 px-2.5 text-center whitespace-nowrap">Tổng số</th>
                    <th className="py-3.5 px-2.5 text-center whitespace-nowrap">Bảo trì</th>
                    <th className="py-3.5 px-2.5 text-center whitespace-nowrap">Khả dụng</th>
                    <th className="py-3.5 px-2.5 whitespace-nowrap">Trạng thái</th>
                    <th className="py-3.5 px-3 text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      {/* Name & Photo */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <span className="font-bold text-[#172033] block text-sm sm:text-base">
                              {item.name}
                            </span>
                            {item.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-2.5 text-xs font-medium text-slate-700">
                        {item.categoryName ? (
                          <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E0E6EE] text-slate-800">
                            {item.categoryName}
                          </span>
                        ) : (
                          <span className="whitespace-nowrap text-slate-400 italic">Chưa phân nhóm</span>
                        )}
                      </td>

                      <td className="py-4 px-2.5 text-center font-semibold tabular-nums">{item.totalQuantity}</td>
                      <td className="py-4 px-2.5 text-center font-semibold tabular-nums text-amber-700">{item.maintenanceQuantity}</td>
                      <td className="py-4 px-2.5 text-center font-semibold tabular-nums text-emerald-700">{item.availableQuantity}</td>

                      {/* Active Status */}
                      <td className="py-4 px-2.5">
                        {item.active ? (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3 h-3 shrink-0" />
                            <span>Bảo trì</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 rounded-lg text-slate-500 hover:text-[#0B7058] hover:bg-[#F3F6FA] transition-colors cursor-pointer"
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
                            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
      </div>

      <aside className="rounded-2xl border border-[#E0E6EE] bg-white p-5 shadow-2xs lg:min-h-[580px]">
        <h2 className="mb-5 flex items-center gap-3 text-xl font-bold text-[#172033]"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F5F1] text-[#0B7058]"><Boxes className="h-5 w-5" /></span>Combo cho thuê</h2>
        {isLoading ? <p className="text-sm text-slate-500">Đang tải combo…</p> : rentalPackages.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">Chưa có combo thiết bị.</div> : <div className="space-y-4">{rentalPackages.map(pkg => <article key={pkg.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{pkg.title}</h3><span className="mt-1 block text-sm text-slate-500">{pkg.items.length} thiết bị</span></div><span className="whitespace-nowrap rounded-lg bg-[#D9F2ED] px-2.5 py-1.5 font-bold text-[#075541]">{formatVND(pkg.rentalPriceVnd)}/ngày</span></div><div className="mt-3 space-y-2 border-t border-slate-100 pt-3">{pkg.items.map(item => <div key={item.equipmentId} className="flex items-start gap-2 text-sm text-slate-700"><Package className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"/><span>{item.name} <strong>× {item.quantityInPackage}</strong></span></div>)}</div></article>)}</div>}
      </aside>

      {/* Modal: Tạo / Chỉnh sửa Thiết bị & Tồn kho */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} preventClose={isSubmitting} maxWidth="xl" title={editingItem ? 'Chỉnh sửa thiết bị & kho' : 'Thêm thiết bị mới'}><div className="space-y-5">


            {formError && (
              <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
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
                <label htmlFor="equipmentcatalogtab-field-1" className="block text-sm font-medium text-[#172033] mb-2">
                  Tên thiết bị <span className="text-red-500">*</span>
                </label>
              <input id="equipmentcatalogtab-field-1"                   type="text"
                  maxLength={200}
                  required
                  placeholder="Ví dụ: Lều 2 người Naturehike, Gậy trekking Black Diamond..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0B7058] focus:ring-1 focus:ring-[#0B7058] outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="equipmentcatalogtab-field-2" className="block text-sm font-medium text-[#172033] mb-2">
                  Mô tả / Thông số kỹ thuật
                </label>
              <textarea id="equipmentcatalogtab-field-2"                   rows={2}
                  placeholder="Trọng lượng, kích thước, khả năng chống nước..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0B7058] focus:ring-1 focus:ring-[#0B7058] outline-none resize-none"
                />
              </div>

              {/* Rental Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                <div>
                  <label htmlFor="equipmentcatalogtab-field-3" className="block text-sm font-medium text-[#172033] mb-2">
                    Giá thuê lẻ (VNĐ)
                  </label>
              <input id="equipmentcatalogtab-field-3"                     type="number"
                    min="0"
                    step="1000"
                    placeholder="Để trống nếu chưa thiết lập"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0B7058] focus:ring-1 focus:ring-[#0B7058] outline-none font-mono"
                  />
                  <span className="text-xs text-slate-400 mt-1 block">
                    0 đ là giá hợp lệ (miễn phí)
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#172033]">
                      Nhóm thiết bị
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickCategoryOpen((prev) => !prev);
                        setCategoryCreateError(null);
                      }}
                      className="text-xs font-semibold text-[#0B7058] hover:text-[#075743] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isQuickCategoryOpen ? 'Đóng tạo nhóm' : 'Tạo nhóm mới'}</span>
                    </button>
                  </div>

                  {/* Inline quick category creation box */}
                  {isQuickCategoryOpen && (
                    <div className="mb-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#0B7058]/30 space-y-2.5 animate-in fade-in duration-150 shadow-xs">
                      <div className="flex items-center justify-between text-xs text-[#172033]">
                        <span className="font-bold">Tạo nhóm thiết bị mới</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickCategoryOpen(false);
                            setNewCategoryName('');
                            setCategoryCreateError(null);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 cursor-pointer"
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
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B7058] focus:border-[#0B7058]"
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
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            disabled={isCreatingCategory || !newCategoryName.trim()}
                            onClick={handleQuickCreateCategory}
                            className="px-3.5 py-1.5 text-xs rounded-lg bg-[#0B7058] hover:bg-[#075743] text-white font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
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
                        <p className="text-xs text-red-600 font-medium">{categoryCreateError}</p>
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0B7058] focus:ring-1 focus:ring-[#0B7058] outline-none bg-white cursor-pointer"
                  >
                    <option value="">-- Chưa chọn nhóm --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__CREATE_NEW__" className="text-[#0B7058] font-semibold bg-emerald-50">
                      + Thêm nhóm mới vào danh sách...
                    </option>
                  </select>
                </div>
              </div>

              {/* Inventory Quantities */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E0E6EE] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                  <Boxes className="w-4 h-4 text-[#0B7058]" />
                  <span>Quản lý số lượng tồn kho</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="equipmentcatalogtab-field-4" className="block text-xs font-medium text-slate-600 mb-1">
                      Tổng số lượng có
                    </label>
              <input id="equipmentcatalogtab-field-4"                       type="number"
                      min="0"
                      required
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#0B7058] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="equipmentcatalogtab-field-5" className="block text-xs font-medium text-slate-600 mb-1">
                      Đang bảo trì / hỏng
                    </label>
              <input id="equipmentcatalogtab-field-5"                       type="number"
                      min="0"
                      required
                      value={maintenanceQuantity}
                      onChange={(e) => setMaintenanceQuantity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#0B7058] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-600">Số lượng khả dụng ước tính:</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {Math.max(0, (parseInt(totalQuantity, 10) || 0) - (parseInt(maintenanceQuantity, 10) || 0))} món
                  </span>
                </div>
              </div>

              {/* Image Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#172033]">
                  Hình ảnh thiết bị
                </label>
                {imagePreviewUrl ? (
                  <div className="relative w-32 h-24 rounded-xl border border-slate-200 overflow-hidden group">
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
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#0B7058] rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#FAF8F5]/50">
                    <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-[#0B7058]">
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
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E0E6EE]">
                <div>
                  <span className="text-xs font-bold text-[#172033] block">Trạng thái thiết bị</span>
                  <span className="text-xs text-slate-500 block">
                    Đang sẵn sàng cho tour thuê
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    aria-label="Active" className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-[#0B7058] peer-focus-visible:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B7058]"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting} onClick={() => { if (!isSubmitting) setIsModalOpen(false); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0B7058] hover:bg-[#075743] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Lưu thay đổi' : 'Thêm thiết bị'}</span>
                </button>
              </div>
            </form>
          </div></Modal>
      )}

      {/* Modal: Xác nhận xóa Thiết bị */}
      {deletingItem && (
        <Modal isOpen={Boolean(deletingItem)} onClose={() => setDeletingItem(null)} preventClose={isDeleting} maxWidth="md" title="Xác nhận xóa thiết bị"><div className="space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">

              <p className="text-xs text-slate-600">
                Xóa thiết bị <strong className="text-slate-900">"{deletingItem.name}"</strong>? Thiết bị sẽ không còn được chọn mới và vẫn xuất hiện trong lịch sử.
              </p>
            </div>

            {deleteError && (
              <div role="alert" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
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
                <span>Xóa</span>
              </button>
            </div>
          </div></Modal>
      )}
    </div>
  );
};
