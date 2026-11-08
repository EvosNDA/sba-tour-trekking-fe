import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, X, Loader2 } from 'lucide-react';
import type { ApiError } from '../../../types/api.types';
import { AdminAccountItem } from '../types/user.types';

export interface AccountActionModalProps {
  isOpen: boolean;
  account: AdminAccountItem | null;
  actionType: 'block' | 'unblock';
  isSubmitting: boolean;
  error?: ApiError | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const AccountActionModal: React.FC<AccountActionModalProps> = ({
  isOpen,
  account,
  actionType,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen, account]);

  if (!isOpen || !account) return null;

  const isBlock = actionType === 'block';
  const trimmedReason = reason.trim();
  const isValidReason = trimmedReason.length > 0 && trimmedReason.length <= 2000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidReason || isSubmitting) return;
    onConfirm(trimmedReason);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-action-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isBlock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isBlock ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2
                id="account-action-modal-title"
                className="text-base font-bold text-stone-900"
              >
                {isBlock ? 'Khóa tài khoản người dùng' : 'Mở khóa tài khoản'}
              </h2>
              <p className="text-xs text-stone-500">
                {isBlock
                  ? 'Tài khoản bị khóa sẽ không thể đăng nhập hoặc thực hiện giao dịch.'
                  : 'Cho phép tài khoản tiếp tục đăng nhập và sử dụng dịch vụ.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông tin đối tượng */}
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-stone-500">Người dùng:</span>
            <strong className="text-stone-900">{account.fullName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Email:</span>
            <span className="font-mono text-stone-800">{account.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Mã tài khoản:</span>
            <span className="font-mono text-stone-800">#{account.id}</span>
          </div>
        </div>

        {/* Form nhập lý do */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="action-reason"
                className="text-xs font-semibold text-stone-700"
              >
                Lý do {isBlock ? 'khóa' : 'mở khóa'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  reason.length > 2000 ? 'text-rose-600 font-bold' : 'text-stone-400'
                }`}
              >
                {reason.length} / 2000
              </span>
            </div>

            <textarea
              id="action-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isBlock
                  ? 'Nhập lý do khóa tài khoản (bắt buộc, tối đa 2000 ký tự)...'
                  : 'Nhập lý do mở khóa tài khoản (bắt buộc, tối đa 2000 ký tự)...'
              }
              maxLength={2000}
              disabled={isSubmitting}
              className="w-full text-xs p-3 bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:border-stone-800 transition-colors resize-none disabled:bg-stone-100 text-stone-800"
            />

            {error?.fieldErrors?.reason && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {error.fieldErrors.reason}
              </p>
            )}
          </div>

          {/* Lỗi chung từ API */}
          {error && !error.fieldErrors?.reason && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1"
            >
              <p className="font-semibold">{error.message}</p>
              {error.code && (
                <p className="font-mono text-[11px] text-rose-600">Mã lỗi: {error.code}</p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isValidReason || isSubmitting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                isBlock
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isBlock ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
