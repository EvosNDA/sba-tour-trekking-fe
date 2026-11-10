import React, { useState } from 'react';
import { AlertCircle, MailPlus, ShieldCheck } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { usersApi } from '../api/users.api';
import type { AdminAccountItem, AdminAccountRole, AdminInvitationRequest } from '../types/user.types';
import type { ApiError } from '../../../types/api.types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onInvited: (response: { accountId: number; email: string; role: string; deliveryStatus: string }) => void;
  onRolesUpdated: (account: AdminAccountItem) => void;
};

const roles: { value: AdminAccountRole; label: string }[] = [
  { value: 'customer', label: 'Khách hàng' },
  { value: 'guide', label: 'Hướng dẫn viên' },
  { value: 'admin', label: 'Quản trị viên' },
];

export const AccountInvitationModal: React.FC<Props> = ({ isOpen, onClose, onInvited, onRolesUpdated }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'GUIDE'>('GUIDE');
  const [mode, setMode] = useState<'invite' | 'duplicate' | 'roles'>('invite');
  const [existing, setExisting] = useState<AdminAccountItem | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AdminAccountRole[]>([]);
  const [reason, setReason] = useState('Cập nhật vai trò theo yêu cầu mời tài khoản');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setEmail(''); setFullName(''); setMode('invite'); setExisting(null); setError('');
    onClose();
  };

  const submitInvite = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    const payload: AdminInvitationRequest = { email: email.trim(), fullName: fullName.trim(), role };
    try {
      const response = await usersApi.inviteAccount(payload);
      onInvited(response);
      close();
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 'EMAIL_ALREADY_REGISTERED' || apiError.code === 'DUPLICATE_EMAIL' || apiError.status === 409) {
        try {
          const result = await usersApi.getAccounts({ q: payload.email, size: 20 });
          const match = result.items.find((item) => item.email.toLowerCase() === payload.email.toLowerCase());
          if (match) {
            setExisting(match);
            setSelectedRoles(match.roles || []);
            setMode('duplicate');
            return;
          }
        } catch { /* Keep the duplicate notice useful even if the account lookup is unavailable. */ }
        setError('Email này đã có tài khoản. Hãy tìm email trong danh sách tài khoản để cập nhật vai trò.');
      } else setError(apiError.message || 'Không thể gửi lời mời. Vui lòng thử lại.');
    } finally { setBusy(false); }
  };

  const submitRoles = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!existing) return;
    setBusy(true); setError('');
    try {
      const updated = await usersApi.replaceAccountRoles(existing.id, { roles: selectedRoles, reason });
      onRolesUpdated({ ...existing, roles: updated.roles, fullName: updated.fullName, phone: updated.phone, status: updated.status });
      close();
    } catch (err) {
      setError((err as ApiError).message || 'Không thể cập nhật vai trò. Vui lòng thử lại.');
    } finally { setBusy(false); }
  };

  const toggleRole = (value: AdminAccountRole) => setSelectedRoles((current) =>
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  return <Modal isOpen={isOpen} onClose={close} title={mode === 'roles' ? 'Cập nhật vai trò tài khoản' : 'Mời tài khoản'} subtitle={mode === 'roles' ? 'Chọn các vai trò cần gán cho tài khoản.' : 'Gửi email kích hoạt cho quản trị viên hoặc hướng dẫn viên.'} maxWidth="lg" preventClose={busy}>
    {mode === 'invite' && <form onSubmit={submitInvite} className="space-y-4">
      <label className="block text-sm font-medium">Họ và tên<input required maxLength={200} value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-stone-300 px-3" /></label>
      <label className="block text-sm font-medium">Email<input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-stone-300 px-3" /></label>
      <label className="block text-sm font-medium">Vai trò mời<select value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'GUIDE')} className="mt-1.5 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3"><option value="GUIDE">Hướng dẫn viên</option><option value="ADMIN">Quản trị viên</option></select></label>
      <button disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1F4E43] px-4 font-semibold text-white disabled:opacity-60"><MailPlus size={17} />{busy ? 'Đang gửi…' : 'Gửi lời mời'}</button>
    </form>}
    {mode === 'duplicate' && existing && <div className="space-y-4">
      <div role="status" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><AlertCircle className="mt-0.5 shrink-0" size={18} /><p><strong>Email này đã có tài khoản.</strong><br />{existing.fullName} ({existing.email}) hiện có vai trò: {existing.roles.join(', ') || 'chưa được gán'}. Bạn có thể cập nhật vai trò ngay.</p></div>
      <button type="button" onClick={() => { setMode('roles'); setError(''); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1F4E43] px-4 font-semibold text-white"><ShieldCheck size={17} />Cập nhật vai trò</button>
    </div>}
    {mode === 'roles' && existing && <form onSubmit={submitRoles} className="space-y-4">
      <p className="text-sm text-stone-600">{existing.fullName} · {existing.email}</p>
      <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">Vai trò</legend>{roles.map((item) => <label key={item.value} className="flex min-h-11 items-center gap-3 rounded-lg border border-stone-200 px-3"><input type="checkbox" checked={selectedRoles.includes(item.value)} onChange={() => toggleRole(item.value)} />{item.label}</label>)}</fieldset>
      <label className="block text-sm font-medium">Lý do cập nhật<textarea required maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 p-3" rows={3} /></label>
      <button type="submit" disabled={busy || selectedRoles.length === 0} className="min-h-11 rounded-xl bg-[#1F4E43] px-4 font-semibold text-white disabled:opacity-60">{busy ? 'Đang cập nhật…' : 'Lưu vai trò'}</button>
    </form>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {mode === 'duplicate' && <button type="button" onClick={() => { setMode('invite'); setError(''); }} className="mt-4 text-sm font-medium text-stone-600 underline">Quay lại lời mời</button>}
  </Modal>;
};
