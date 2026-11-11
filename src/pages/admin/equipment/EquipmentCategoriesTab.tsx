import { Modal } from '../../../components/ui/Modal';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FolderTree,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { equipmentApi } from '../../../features/equipment/api/equipment.api';
import type {
  EquipmentCategory,
  SaveCategoryRequest,
} from '../../../features/equipment/types/equipment.types';
import { toast } from '../../../components/ui/Toast';

export const EquipmentCategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null);
  const [formData, setFormData] = useState<SaveCategoryRequest>({
    name: '',
    description: '',
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deletingCategory, setDeletingCategory] = useState<EquipmentCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await equipmentApi.listCategories();
      setCategories(data || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách nhóm thiết bị.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', active: true });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: EquipmentCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      active: cat.active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên nhóm thiết bị.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingCategory) {
        await equipmentApi.updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          active: formData.active ?? true,
        });
        toast.success(`Đã cập nhật nhóm "${formData.name.trim()}" thành công!`);
      } else {
        await equipmentApi.createCategory({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          active: formData.active ?? true,
        });
        toast.success(`Đã tạo nhóm "${formData.name.trim()}" thành công!`);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setFormError(err?.message || 'Không thể lưu nhóm thiết bị. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await equipmentApi.deleteCategory(deletingCategory.id);
      toast.success(`Đã xóa nhóm "${deletingCategory.name}" thành công!`);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err: any) {
      // If category is in use, display friendly reason
      const msg =
        err?.status === 400 || err?.status === 409 || err?.status === 500
          ? 'Không thể xóa nhóm này vì đang có thiết bị trong kho được gán vào nhóm. Vui lòng chuyển thiết bị sang nhóm khác trước khi xóa.'
          : err?.message || 'Không thể xóa nhóm thiết bị.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-[#E0E6EE] shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên nhóm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0B7058] focus:ring-1 focus:ring-[#0B7058] outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCategories}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-[#F3F6FA] transition-colors cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B7058] hover:bg-[#075743] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhóm mới</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#E0E6EE] p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B7058] mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Đang tải danh sách nhóm thiết bị...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchCategories}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B7058] text-white text-xs font-semibold hover:bg-[#075743] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Categories table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-2xl border border-[#E0E6EE] overflow-hidden shadow-2xs">
          {filteredCategories.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F3F6FA] border border-[#E0E6EE] flex items-center justify-center text-[#0B7058] mx-auto">
                <FolderTree className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-[#172033]">
                {searchQuery ? 'Không tìm thấy nhóm phù hợp' : 'Chưa có nhóm thiết bị nào'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Thử thay đổi từ khóa tìm kiếm.'
                  : 'Hãy tạo nhóm thiết bị đầu tiên để phân loại các món đồ trekking trong kho.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B7058] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo nhóm ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF8F5] border-b border-[#E0E6EE] text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3.5 px-6">Tên nhóm</th>
                    <th className="py-3.5 px-6">Mô tả</th>
                    <th className="py-3.5 px-6">Trạng thái</th>
                    <th className="py-3.5 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-[#172033]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#0B7058]/10 text-[#0B7058] flex items-center justify-center shrink-0">
                            <FolderTree className="w-4 h-4" />
                          </div>
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-md">
                        {cat.description || (
                          <span className="text-slate-400 italic">Chưa có mô tả</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {cat.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tạm ngưng</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B7058] hover:bg-[#F3F6FA] transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingCategory(cat);
                              setDeleteError(null);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa nhóm"
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

      {/* Modal: Tạo / Chỉnh sửa nhóm */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} preventClose={isSubmitting} maxWidth="md" title={editingCategory ? 'Chỉnh sửa nhóm thiết bị' : 'Tạo nhóm thiết bị mới'}><div className="space-y-5">


            {formError && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="equipmentcategoriestab-field-1" className="block text-sm font-medium text-[#172033] mb-2">
                  Tên nhóm <span className="text-red-500">*</span>
                </label>
              <input id="equipmentcategoriestab-field-1"                   type="text"
                  maxLength={120}
                  required
                  placeholder="Ví dụ: Lều trại & Túi ngủ, Dụng cụ nấu ăn..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0B7058] focus:ring-1 focus:ring-[#0B7058] outline-none"
                />
              </div>

              <div>
                <label htmlFor="equipmentcategoriestab-field-2" className="block text-sm font-medium text-[#172033] mb-2">
                  Mô tả nhóm
                </label>
              <textarea id="equipmentcategoriestab-field-2"                   rows={3}
                  placeholder="Mô tả công dụng hoặc phạm vi của nhóm thiết bị này..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0B7058] focus:ring-1 focus:ring-[#0B7058] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E0E6EE]">
                <div>
                  <span className="text-xs font-bold text-[#172033] block">Trạng thái hoạt động</span>
                  <span className="text-xs text-slate-500 block">
                    Cho phép chọn nhóm này khi tạo thiết bị mới
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active ?? true}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    aria-label="Active" className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-[#0B7058] peer-focus-visible:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B7058]"></div>
                </label>
              </div>

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
                  <span>{editingCategory ? 'Lưu thay đổi' : 'Tạo nhóm'}</span>
                </button>
              </div>
            </form>
          </div></Modal>
      )}

      {/* Modal: Xác nhận xóa nhóm */}
      {deletingCategory && (
        <Modal isOpen={Boolean(deletingCategory)} onClose={() => setDeletingCategory(null)} preventClose={isDeleting} maxWidth="md" title="Xác nhận xóa nhóm thiết bị"><div className="space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">

              <p className="text-xs text-slate-600">
                Bạn có chắc chắn muốn xóa nhóm <strong className="text-slate-900">"{deletingCategory.name}"</strong>?
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
                onClick={() => setDeletingCategory(null)}
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
                <span>Xóa vĩnh viễn</span>
              </button>
            </div>
          </div></Modal>
      )}
    </div>
  );
};
