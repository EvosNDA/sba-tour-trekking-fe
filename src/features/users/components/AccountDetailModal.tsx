import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2,
} from 'lucide-react';
import { AdminAccountDetail } from '../types/user.types';
import { usersApi } from '../api/users.api';
import { UserAvatar } from './UserAvatar';
import type { ApiError } from '../../../types/api.types';

export interface AccountDetailModalProps {
  isOpen: boolean;
  accountId: number | null;
  onClose: () => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  isOpen,
  accountId,
  onClose,
}) => {
  const [detail, setDetail] = useState<AdminAccountDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!isOpen || accountId === null) {
      setDetail(null);
      setError(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    usersApi
      .getAccountDetail(accountId)
      .then((res) => {
        if (active) setDetail(res);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, accountId]);

  if (!isOpen || accountId === null) return null;

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return isoStr;
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  const renderRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Quản trị viên';
      case 'guide':
        return 'Hướng dẫn viên';
      case 'customer':
      default:
        return 'Khách hàng';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-detail-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-stone-700" />
            <h2
              id="account-detail-modal-title"
              className="text-base font-bold text-stone-900"
            >
              Hồ sơ chi tiết tài khoản
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-stone-500" />
            <span className="text-xs text-stone-500">Đang tải thông tin tài khoản...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error.message || 'Không thể tải chi tiết tài khoản'}</span>
            </div>
          </div>
        )}

        {!isLoading && detail && (
          <div className="space-y-4 text-xs">
            {/* Identity Card */}
            <div className="flex items-center gap-3.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
              <UserAvatar name={detail.fullName} size="lg" />
              <div className="space-y-0.5 truncate">
                <h3 className="font-bold text-sm text-stone-900 truncate">
                  {detail.fullName}
                </h3>
                <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                  <span>ID: #{detail.id}</span>
                  <span>•</span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium text-[10px] ${
                      detail.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800'
                        : detail.status === 'blocked'
                        ? 'bg-rose-50 text-rose-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {detail.status === 'active'
                      ? 'Hoạt động'
                      : detail.status === 'blocked'
                      ? 'Đã khóa'
                      : 'Vô hiệu'}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400" /> Email liên hệ
                </span>
                <p className="font-mono text-stone-800 font-medium truncate" title={detail.email}>
                  {detail.email}
                </p>
              </div>

              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" /> Số điện thoại
                </span>
                <p className="font-mono text-stone-800 font-medium">
                  {detail.phone || 'Chưa cập nhật'}
                </p>
              </div>

              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-stone-400" /> Vai trò (Roles)
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {detail.roles.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-medium text-[11px]"
                    >
                      {renderRoleLabel(r)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" /> Ngày tạo tài khoản
                </span>
                <p className="font-mono text-stone-800 font-medium">
                  {formatDate(detail.createdAt)}
                </p>
              </div>
            </div>

            {/* Trạng thái xác thực & Bảo mật */}
            <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> Xác thực Email:
                </span>
                <span className="font-mono text-stone-800">
                  {detail.emailVerifiedAt ? (
                    <span className="text-emerald-700">Đã xác thực ({formatDate(detail.emailVerifiedAt)})</span>
                  ) : (
                    <span className="text-stone-400">Chưa xác thực</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-600 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-stone-400" /> Yêu cầu đổi mật khẩu:
                </span>
                <span className="font-medium">
                  {detail.mustChangePassword ? (
                    <span className="text-amber-700 font-semibold">Bắt buộc</span>
                  ) : (
                    <span className="text-stone-500">Không</span>
                  )}
                </span>
              </div>
            </div>

            {/* Chi tiết khóa nếu status = blocked */}
            {detail.status === 'blocked' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-rose-800 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Thông tin xử lý vi phạm</span>
                </div>
                <div className="space-y-1 text-stone-700">
                  <div>
                    <span className="text-stone-500">Lý do khóa: </span>
                    <span className="font-medium text-stone-900">
                      {detail.blockedReason || 'Không có lý do chi tiết'}
                    </span>
                  </div>
                  {detail.blockedBy && (
                    <div>
                      <span className="text-stone-500">Người thực hiện khóa: </span>
                      <span className="font-mono text-stone-900 font-medium">
                        Admin ID #{detail.blockedBy}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
