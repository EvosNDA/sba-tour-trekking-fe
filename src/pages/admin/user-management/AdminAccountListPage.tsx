import { FilterToolbar } from '../../../components/ui/FilterToolbar';
import { Pagination } from '../../../components/ui/Pagination';
import { DataTable } from '../../../components/ui/DataTable';
import { DataState } from '../../../components/ui/DataState';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Crown,
  PersonStanding,
  ArrowLeftRight,
  AlertCircle,
  ShieldCheck,
  UserPlus,
  UserRoundPlus,
} from 'lucide-react';
import {
  AdminAccountItem,
  AdminAccountRoleParam,
  AdminAccountStatusParam,
} from '../../../features/users/types/user.types';
import { usersApi } from '../../../features/users/api/users.api';
import { UserAvatar } from '../../../features/users/components/UserAvatar';
import { AccountActionModal } from '../../../features/users/components/AccountActionModal';
import { AccountDetailModal } from '../../../features/users/components/AccountDetailModal';
import { AccountInvitationModal } from '../../../features/users/components/AccountInvitationModal';
import { useAuthStore } from '../../../stores/auth.store';
import { useDebounce } from '../../../hooks/useDebounce';
import { toast } from '../../../components/ui/Toast';
import type { ApiError } from '../../../types/api.types';

export const AdminAccountListPage: React.FC = () => {
  const { account: currentAccount, user: currentUser } = useAuthStore();
  const currentAccountId = currentAccount?.id
    ? Number(currentAccount.id)
    : currentUser?.id
    ? Number(currentUser.id)
    : null;

  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [roleFilter, setRoleFilter] = useState<AdminAccountRoleParam | ''>('');
  const [statusFilter, setStatusFilter] = useState<AdminAccountStatusParam | ''>('');
  const sortParam = 'createdAt,desc';

  // Pagination States
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Data & Request States
  const [items, setItems] = useState<AdminAccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Modal Action States
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [targetAccount, setTargetAccount] = useState<AdminAccountItem | null>(null);
  const [actionType, setActionType] = useState<'block' | 'unblock'>('block');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<ApiError | null>(null);

  // Detail Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailAccountId, setDetailAccountId] = useState<number | null>(null);
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [roleEditAccount, setRoleEditAccount] = useState<AdminAccountItem | null>(null);

  const openRoleEditor = (account: AdminAccountItem) => {
    setRoleEditAccount(account);
    setInvitationModalOpen(true);
  };

  // Fetch accounts list
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await usersApi.getAccounts({
        page,
        size,
        q: debouncedSearch.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sort: sortParam,
      });
      setItems(res.items || []);
      setTotalElements(res.totalElements ?? 0);
      setTotalPages(res.totalPages ?? 0);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, debouncedSearch, roleFilter, statusFilter, sortParam]);

  // Reset về page 0 khi filter thay đổi
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, roleFilter, statusFilter, sortParam]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return isoStr;
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs bg-[#DDF2EF] text-[#126A55] border border-[#C5E8E2]">
            <Crown aria-hidden="true" className="h-4 w-4" />
            Quản trị viên
          </span>
        );
      case 'guide':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs bg-[#FFF2DE] text-[#A85C0A] border border-[#F7E4C5]">
            <PersonStanding aria-hidden="true" className="h-4 w-4" />
            Hướng dẫn viên
          </span>
        );
      case 'customer':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs bg-[#EEF2F7] text-[#43556D] border border-[#DEE5EE]">
            <Users aria-hidden="true" className="h-4 w-4" />
            Khách hàng
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Hoạt động
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Đã khóa
          </span>
        );
      case 'disabled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Vô hiệu
          </span>
        );
    }
  };

  const handleOpenAction = (acc: AdminAccountItem, type: 'block' | 'unblock') => {
    setTargetAccount(acc);
    setActionType(type);
    setActionError(null);
    setActionModalOpen(true);
  };

  const handleConfirmAction = async (reason: string) => {
    if (!targetAccount) return;
    setIsSubmittingAction(true);
    setActionError(null);

    try {
      let updatedRes;
      if (actionType === 'block') {
        updatedRes = await usersApi.blockAccount(targetAccount.id, { reason });
        toast.success(`Đã khóa tài khoản "${targetAccount.fullName}" thành công.`);
      } else {
        updatedRes = await usersApi.unblockAccount(targetAccount.id, { reason });
        toast.success(`Đã mở khóa tài khoản "${targetAccount.fullName}" thành công.`);
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === updatedRes.id
            ? {
                ...item,
                status: updatedRes.status,
                roles: updatedRes.roles,
                fullName: updatedRes.fullName,
                phone: updatedRes.phone,
              }
            : item
        )
      );

      setActionModalOpen(false);
      setTargetAccount(null);
    } catch (err: any) {
      setActionError(err);
      if (err?.code === 'ACCOUNT_NOT_FOUND' || err?.status === 404) {
        toast.error('Tài khoản không tồn tại hoặc đã bị xóa. Đang làm mới danh sách...');
        fetchAccounts();
      } else if (err?.code === 'SELF_ACCOUNT_MUTATION_FORBIDDEN' || err?.status === 403) {
        toast.error('Bạn không thể thao tác trên chính tài khoản của mình.');
      } else if (err?.code === 'INVALID_ACCOUNT_TRANSITION' || err?.status === 409) {
        toast.error('Trạng thái tài khoản đã thay đổi hoặc không hợp lệ.');
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#172033] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card theo spec chuẩn */}
        <section className="space-y-4">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DDF2EF] text-[#126A55]"><UserRoundPlus className="h-7 w-7" /></span>
            <div><h1 className="text-4xl font-bold tracking-tight text-[#101B2A]">Tài khoản</h1><p className="mt-1 text-base text-[#556274]">Quản lý vai trò và trạng thái truy cập của người dùng.</p></div>
          </div>
          <button type="button" onClick={() => { setRoleEditAccount(null); setInvitationModalOpen(true); }} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0B7058] px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#075743]"><UserPlus className="h-5 w-5" />Mời hướng dẫn viên</button>
        </section>

        {/* Filter Toolbar Card theo spec chuẩn */}
        <FilterToolbar>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tên hoặc email..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0B7058] transition-colors"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Lọc Role */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as AdminAccountRoleParam | '')}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#0B7058]"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  <option value="GUIDE">Hướng dẫn viên (GUIDE)</option>
                  <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                </select>
              </div>

              {/* Lọc Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AdminAccountStatusParam | '')}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#0B7058]"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="BLOCKED">Đã khóa (BLOCKED)</option>
                <option value="DISABLED">Vô hiệu (DISABLED)</option>
              </select>

            </div>
          </div>
        </FilterToolbar>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error.message || 'Không thể tải danh sách tài khoản người dùng.'}</span>
            </div>
            <button
              type="button"
              onClick={fetchAccounts}
              className="px-3.5 py-1.5 bg-white border border-rose-300 rounded-xl text-rose-700 font-semibold hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Main Table Card theo spec chuẩn */}
        <div className="bg-white rounded-2xl border border-[#E0E6EE] overflow-hidden shadow-2xs">
          <div className="divide-y divide-[#E0E6EE] md:hidden" aria-busy={isLoading}>
            {isLoading ? <p role="status" className="p-6 text-sm text-slate-600">Đang tải tài khoản…</p> : items.length === 0 ? <DataState title="Không tìm thấy tài khoản" description="Thử thay đổi hoặc xóa bộ lọc để xem kết quả khác." /> : items.map((acc) => {
              const isSelf = currentAccountId !== null && acc.id === currentAccountId;
              const isAdminRole = acc.roles?.some((r) => r.toLowerCase() === 'admin');
              const canMutate = !isSelf && !isAdminRole && acc.status !== 'disabled';
              return <article key={acc.id} className="space-y-4 p-5">
                <div className="flex items-start gap-3"><UserAvatar name={acc.fullName} size="sm" /><div className="min-w-0 flex-1"><h2 className="break-words text-base font-semibold">{acc.fullName} {isSelf && <span className="text-sm font-normal text-[#0B7058]">(Bạn)</span>}</h2><p className="mt-1 break-all text-sm text-slate-600">{acc.email}</p><p className="mt-1 text-sm text-slate-600">{acc.phone || 'Chưa có số điện thoại'}</p></div></div>
                <div className="flex flex-wrap gap-2">{acc.roles.map((r) => <React.Fragment key={r}>{renderRoleBadge(r)}</React.Fragment>)}{renderStatusBadge(acc.status)}</div>
                <p className="text-sm text-slate-500">Ngày tạo: {formatDate(acc.createdAt)}</p>
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => { setDetailAccountId(acc.id); setDetailModalOpen(true); }} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-medium">Xem hồ sơ</button>
                  <button type="button" onClick={() => openRoleEditor(acc)} disabled={isSelf} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-[#0B7058] disabled:cursor-not-allowed disabled:opacity-50"><ArrowLeftRight className="h-4 w-4" />Đổi vai trò</button>
                  {(acc.status === 'active' || acc.status === 'blocked') && <button type="button" disabled={!canMutate} onClick={() => handleOpenAction(acc, acc.status === 'active' ? 'block' : 'unblock')} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-medium text-[#0B7058] disabled:cursor-not-allowed disabled:opacity-50">{acc.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}</button>}
                </div>
                {!canMutate && <p className="text-xs text-slate-500">{isSelf ? 'Bạn không thể thay đổi trạng thái tài khoản của mình.' : isAdminRole ? 'Không thể thay đổi trạng thái tài khoản quản trị viên.' : 'Tài khoản đã vô hiệu.'}</p>}
              </article>;
            })}
          </div>
          <DataTable className="hidden md:block" tableClassName="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-[#E0E6EE]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Họ và tên</th>
                  <th className="py-3.5 px-4 font-semibold">Email</th>
                  <th className="py-3.5 px-4 font-semibold">Vai trò</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 font-semibold">Ngày tạo</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                          <div className="space-y-1 w-32">
                            <div className="h-3.5 bg-slate-200 rounded-sm w-3/4" />
                            <div className="h-2.5 bg-slate-100 rounded-sm w-1/2" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3 bg-slate-200 rounded-sm w-40" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 bg-slate-200 rounded-md w-20" />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="h-4 bg-slate-200 rounded-full w-20 mx-auto" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-3 bg-slate-200 rounded-sm w-20" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-6 bg-slate-200 rounded-lg w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      Không tìm thấy tài khoản người dùng nào phù hợp tiêu chí.
                    </td>
                  </tr>
                ) : (
                  items.map((acc) => {
                    const isSelf = currentAccountId !== null && acc.id === currentAccountId;
                    const isAdminRole = acc.roles?.some(
                      (r) => r.toLowerCase() === 'admin'
                    );
                    const canMutate = !isSelf && !isAdminRole && acc.status !== 'disabled';

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Tên & Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar name={acc.fullName} size="sm" />
                            <div className="truncate max-w-[180px]">
                              <div className="font-semibold text-slate-900 truncate" title={acc.fullName}>
                                {acc.fullName}
                              </div>
                              {isSelf && <span className="text-xs font-semibold text-emerald-800">(Bạn)</span>}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4 font-mono text-slate-800 truncate max-w-[200px]" title={acc.email}>
                          {acc.email}
                        </td>

                        {/* Roles */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {acc.roles.map((r) => (
                              <React.Fragment key={r}>
                                {renderRoleBadge(r)}
                              </React.Fragment>
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {renderStatusBadge(acc.status)}
                        </td>

                        {/* Created At */}
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {formatDate(acc.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button type="button" onClick={() => openRoleEditor(acc)} disabled={isSelf} title={isSelf ? 'Không thể thay đổi vai trò của chính mình' : 'Đổi vai trò'} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-[#0B7058] transition-colors hover:bg-[#EAF5F1] disabled:cursor-not-allowed disabled:opacity-50"><ArrowLeftRight className="h-3.5 w-3.5" />Đổi vai trò</button>
                            {/* Nút Ban / Unban */}
                            {acc.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleOpenAction(acc, 'block')}
                                disabled={!canMutate}
                                title={
                                  isSelf
                                    ? 'Không thể khóa tài khoản của chính mình'
                                    : isAdminRole
                                    ? 'Không thể khóa tài khoản có quyền Quản trị viên'
                                    : 'Khóa tài khoản'
                                }
                                className={`px-2.5 py-1 rounded-lg font-semibold text-xs whitespace-nowrap transition-colors ${
                                  canMutate
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                }`}
                              >
                                Khóa
                              </button>
                            )}

                            {acc.status === 'blocked' && (
                              <button
                                type="button"
                                onClick={() => handleOpenAction(acc, 'unblock')}
                                disabled={!canMutate}
                                title={
                                  isSelf
                                    ? 'Không thể thao tác trên tài khoản của chính mình'
                                    : isAdminRole
                                    ? 'Không thể thao tác trên tài khoản Quản trị viên'
                                    : 'Mở khóa tài khoản'
                                }
                                className={`px-2.5 py-1 rounded-lg font-semibold text-xs whitespace-nowrap transition-colors ${
                                  canMutate
                                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                }`}
                              >
                                Mở khóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </DataTable>

          {/* Pagination Footer */}
          <Pagination page={page} totalPages={totalPages} totalElements={totalElements} pageSize={size} onPageChange={(next) => { if (!isLoading) setPage(next); }} />
        </div>

        {/* Modal xác nhận Khóa / Mở khóa */}
        <AccountActionModal
          isOpen={actionModalOpen}
          account={targetAccount}
          actionType={actionType}
          isSubmitting={isSubmittingAction}
          error={actionError}
          onClose={() => {
            if (!isSubmittingAction) {
              setActionModalOpen(false);
              setTargetAccount(null);
            }
          }}
          onConfirm={handleConfirmAction}
        />

        {/* Modal xem chi tiết tài khoản */}
        <AccountDetailModal
          isOpen={detailModalOpen}
          accountId={detailAccountId}
          onClose={() => {
            setDetailModalOpen(false);
            setDetailAccountId(null);
          }}
        />
        <AccountInvitationModal
          isOpen={invitationModalOpen}
          accountToEdit={roleEditAccount}
          onClose={() => { setInvitationModalOpen(false); setRoleEditAccount(null); }}
          onInvited={(response) => {
            toast.success(response.deliveryStatus === 'sent' ? `Đã gửi lời mời đến ${response.email}.` : `Đã tạo lời mời cho ${response.email}, nhưng email chưa gửi được.`);
            fetchAccounts();
          }}
          onRolesUpdated={(updated) => {
            setItems((current) => current.map((item) => item.id === updated.id ? { ...item, roles: updated.roles, fullName: updated.fullName, phone: updated.phone, status: updated.status } : item));
            toast.success(`Đã cập nhật vai trò cho "${updated.fullName}".`);
          }}
        />
      </div>
    </div>
  );
};

export default AdminAccountListPage;
