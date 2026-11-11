import { Modal } from '../../../components/ui/Modal';
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
    <Modal isOpen={isOpen} onClose={onClose} title={<>{isBlock ? 'Khóa tài khoản người dùng' : 'Mở khóa tài khoản'}</>} subtitle={<>{isBlock
                  ? 'Tài khoản bị khóa sẽ không thể đăng nhập hoặc thực hiện giao dịch.'
                  : 'Cho phép tài khoản tiếp tục đăng nhập và sử dụng dịch vụ.'}</>} preventClose={isSubmitting} maxWidth="lg">
      <div className="space-y-5">

        {/* Thông tin đối tượng */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Người dùng:</span>
            <strong className="text-slate-900">{account.fullName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email:</span>
            <span className="font-mono text-slate-800">{account.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mã tài khoản:</span>
            <span className="font-mono text-slate-800">#{account.id}</span>
          </div>
        </div>

        {/* Form nhập lý do */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="action-reason"
                className="text-sm font-semibold text-slate-700"
              >
                Lý do {isBlock ? 'khóa' : 'mở khóa'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-xs font-mono ${
                  reason.length > 2000 ? 'text-rose-600 font-bold' : 'text-slate-400'
                }`}
              >
                {reason.length} / 2000
              </span>
            </div>

            <textarea
              id="action-reason"
              required
              aria-invalid={Boolean(error?.fieldErrors?.reason)}
              aria-describedby={error?.fieldErrors?.reason ? 'account-reason-error' : undefined}
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
              className="w-full text-sm p-3 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-slate-800 transition-colors resize-none disabled:bg-slate-100 text-slate-800"
            />

            {error?.fieldErrors?.reason && (
              <p id="account-reason-error" className="text-sm text-rose-700 mt-1">
                {error.fieldErrors.reason}
              </p>
            )}
          </div>

          {/* Lỗi chung từ API */}
          {error && !error.fieldErrors?.reason && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 space-y-1"
            >
              <p className="font-semibold">{error.message}</p>
              {error.code && (
                <p className="font-mono text-xs text-rose-600">Mã lỗi: {error.code}</p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isValidReason || isSubmitting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
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
    </Modal>
  );
};
