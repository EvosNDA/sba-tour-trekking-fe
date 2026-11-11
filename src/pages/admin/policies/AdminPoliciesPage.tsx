import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, Globe, Plus, RefreshCw, Search } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { AdminPageHeader } from '../../../components/ui/AdminPageHeader';
import { toast } from '../../../components/ui/Toast';
import { navigateTo } from '../../../lib/navigation';
import { adminPoliciesApi } from '../../../features/policies/api/admin-policies.api';
import { POLICY_DOCUMENTS, policyDocumentPath } from '../../../features/policies/policy-documents';
import {
  POLICY_KIND_LABELS,
  currentVersionOf,
  versionStatusOf,
  type AdminPolicy,
  type AdminPolicyVersion,
  type PolicyKind,
  type PolicyPublishRequest,
} from '../../../features/policies/types/admin-policy.types';
import { PolicyVersionForm } from './components/PolicyVersionForm';
import {
  ActiveBadge,
  FieldLabel,
  RefundTierTable,
  VersionStatusBadge,
  buttonClass,
  fieldClass,
  formatDateTime,
  policyErrorMessage,
  publicDocumentOf,
} from './components/policy-ui';

type PolicyAction =
  | { type: 'status'; policy: AdminPolicy }
  | { type: 'delete'; policy: AdminPolicy }
  | { type: 'revoke'; policy: AdminPolicy; version: AdminPolicyVersion };

type StatusFilter = 'all' | 'active' | 'inactive';

/** Suggested kind for each public website document when admins create it from a preset. */
const PUBLIC_DOCUMENT_KINDS: Record<string, PolicyKind> = {
  REFUND_POLICY: 'cancellation',
  BOOKING_GUIDE: 'general',
  WEBSITE_TERMS: 'general',
  PRIVACY_POLICY: 'general',
  LIABILITY_WAIVER: 'general',
};

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [versions, setVersions] = useState<AdminPolicyVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState('');
  const [viewedVersionId, setViewedVersionId] = useState<number | null>(null);

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<PolicyKind | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [editor, setEditor] = useState<'create' | 'publish' | null>(null);
  const [action, setAction] = useState<PolicyAction | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newKind, setNewKind] = useState<PolicyKind>('general');
  const [newCode, setNewCode] = useState('');

  const loadPolicies = useCallback(async () => {
    setListError('');
    try {
      const data = await adminPoliciesApi.list();
      setPolicies(data);
      setSelectedId((current) => (current && data.some((p) => p.id === current) ? current : data[0]?.id ?? null));
    } catch (reason) {
      setListError(policyErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVersions = useCallback(async (policyId: number) => {
    setVersionsLoading(true);
    setVersionsError('');
    try {
      const data = await adminPoliciesApi.versions(policyId);
      setVersions(data);
      return data;
    } catch (reason) {
      setVersions([]);
      setVersionsError(policyErrorMessage(reason));
      return [];
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  useEffect(() => {
    setViewedVersionId(null);
    if (selectedId == null) {
      setVersions([]);
      return;
    }
    void loadVersions(selectedId);
  }, [selectedId, loadVersions]);

  const selected = policies.find((policy) => policy.id === selectedId) ?? null;
  const current = useMemo(() => currentVersionOf(versions), [versions]);
  const viewed = versions.find((v) => v.id === viewedVersionId) ?? current ?? versions[0];
  const latestLive = versions.find((v) => !v.revokedAt);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return policies.filter(
      (policy) =>
        (kindFilter === 'all' || policy.kind === kindFilter) &&
        (statusFilter === 'all' || (statusFilter === 'active') === policy.active) &&
        (!needle || policy.title.toLowerCase().includes(needle) || policy.code.toLowerCase().includes(needle)),
    );
  }, [policies, query, kindFilter, statusFilter]);

  const takenCodes = useMemo(() => new Set(policies.map((p) => p.code.toUpperCase())), [policies]);
  const missingPublicDocuments = POLICY_DOCUMENTS.filter((document) => !takenCodes.has(document.code));

  const openCreate = (preset?: (typeof POLICY_DOCUMENTS)[number]) => {
    setNewTitle(preset?.label ?? '');
    setNewKind(preset ? PUBLIC_DOCUMENT_KINDS[preset.code] ?? 'general' : 'general');
    setNewCode(preset?.code ?? '');
    setModalError('');
    setEditor('create');
  };

  const openAction = (next: PolicyAction) => {
    setReason('');
    setModalError('');
    setAction(next);
  };

  const createPolicy = async (version: PolicyPublishRequest) => {
    setBusy(true);
    setModalError('');
    try {
      const code = newCode.trim() || `DK-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
      const policy = await adminPoliciesApi.createWithVersion(
        { title: newTitle.trim(), kind: newKind, code },
        { ...version, refundTiers: newKind === 'cancellation' ? version.refundTiers : null },
      );
      await loadPolicies();
      setSelectedId(policy.id);
      setEditor(null);
      toast.success(`Đã tạo “${policy.title}”.`);
    } catch (reason) {
      setModalError(policyErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  const publishVersion = async (version: PolicyPublishRequest) => {
    if (!selected) return;
    setBusy(true);
    setModalError('');
    try {
      const published = await adminPoliciesApi.publish(selected.id, version);
      await Promise.all([loadVersions(selected.id), loadPolicies()]);
      setViewedVersionId(published.id);
      setEditor(null);
      toast.success(`Đã phát hành v${published.versionNumber}.`);
    } catch (reason) {
      setModalError(policyErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  const confirmAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!action) return;
    if (action.type !== 'delete' && !reason.trim()) {
      setModalError('Vui lòng nhập lý do.');
      return;
    }
    setBusy(true);
    setModalError('');
    try {
      if (action.type === 'delete') {
        await adminPoliciesApi.remove(action.policy.id);
        if (selectedId === action.policy.id) setSelectedId(null);
        await loadPolicies();
        toast.success(`Đã xoá “${action.policy.title}”.`);
      } else if (action.type === 'status') {
        await adminPoliciesApi.changeStatus(action.policy.id, !action.policy.active, reason.trim());
        await loadPolicies();
        toast.success(action.policy.active ? 'Đã ngừng áp dụng điều khoản.' : 'Đã kích hoạt lại điều khoản.');
      } else {
        await adminPoliciesApi.revokeVersion(action.policy.id, action.version.id, reason.trim());
        await Promise.all([loadVersions(action.policy.id), loadPolicies()]);
        toast.success(`Đã thu hồi v${action.version.versionNumber}.`);
      }
      setAction(null);
    } catch (reason) {
      setModalError(policyErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  const selectedPublicDocument = selected ? publicDocumentOf(selected.code) : undefined;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-7 lg:px-8">
      <AdminPageHeader
        title="Điều khoản & chính sách"
        description="Quản lý nội dung chính sách, phát hành phiên bản theo thời điểm và các trang chính sách hiển thị trên website."
        actions={
          <button type="button" className={buttonClass.primary} onClick={() => openCreate()}>
            <Plus aria-hidden="true" className="size-4" /> Tạo điều khoản
          </button>
        }
      />

      {!loading && missingPublicDocuments.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <Globe aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              Footer website còn {missingPublicDocuments.length} trang chưa có nội dung:{' '}
              <strong className="font-semibold">{missingPublicDocuments.map((d) => d.label).join(', ')}</strong>.
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {missingPublicDocuments.map((document) => (
              <button
                key={document.code}
                type="button"
                className={`${buttonClass.outline} min-h-8 border-amber-300 px-3 text-xs`}
                onClick={() => openCreate(document)}
              >
                <Plus aria-hidden="true" className="size-3.5" /> {document.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Policy list */}
        <section aria-labelledby="policy-list-title" className="min-w-0 rounded-2xl border border-slate-200 bg-white">
          <h2 id="policy-list-title" className="sr-only">
            Danh sách điều khoản
          </h2>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
            <label className="relative min-w-[200px] flex-1">
              <span className="sr-only">Tìm điều khoản</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className={`${fieldClass} pl-9`} placeholder="Tìm theo tên hoặc mã…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label>
              <span className="sr-only">Lọc theo loại</span>
              <select className={`${fieldClass} w-auto`} value={kindFilter} onChange={(e) => setKindFilter(e.target.value as PolicyKind | 'all')}>
                <option value="all">Mọi loại</option>
                {(Object.keys(POLICY_KIND_LABELS) as PolicyKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {POLICY_KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Lọc theo trạng thái</span>
              <select className={`${fieldClass} w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
                <option value="all">Mọi trạng thái</option>
                <option value="active">Đang áp dụng</option>
                <option value="inactive">Ngừng áp dụng</option>
              </select>
            </label>
          </div>

          {listError ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <p role="alert" className="text-sm text-rose-800">
                {listError}
              </p>
              <button type="button" className={buttonClass.outline} onClick={() => { setLoading(true); void loadPolicies(); }}>
                <RefreshCw aria-hidden="true" className="size-4" /> Thử lại
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-[#F3F6FA] text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Điều khoản</th>
                    <th className="whitespace-nowrap px-4 py-3">Phiên bản</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Cập nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading &&
                    Array.from({ length: 4 }, (_, i) => (
                      <tr key={i} aria-hidden="true">
                        <td className="px-4 py-4" colSpan={4}>
                          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))}
                  {!loading &&
                    filtered.map((policy) => {
                      const publicDocument = publicDocumentOf(policy.code);
                      const isSelected = policy.id === selectedId;
                      return (
                        <tr
                          key={policy.id}
                          aria-selected={isSelected}
                          className={`cursor-pointer transition-colors hover:bg-[#F3FAF7] ${isSelected ? 'bg-[#E7F4F0] hover:bg-[#E7F4F0]' : ''}`}
                          onClick={() => setSelectedId(policy.id)}
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7058]"
                              onClick={(e) => { e.stopPropagation(); setSelectedId(policy.id); }}
                            >
                              <span className="line-clamp-2 font-semibold text-slate-900">{policy.title}</span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
                                <span>{POLICY_KIND_LABELS[policy.kind] ?? policy.kind}</span>
                                <span aria-hidden="true">·</span>
                                <code className="break-all font-mono">{policy.code}</code>
                                {publicDocument && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-1.5 py-px text-[11px] font-medium text-sky-800">
                                    <Globe aria-hidden="true" className="size-3" /> Website
                                  </span>
                                )}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 tabular-nums text-slate-700">{policy.versionNumber ? `v${policy.versionNumber}` : '—'}</td>
                          <td className="px-4 py-3">
                            <ActiveBadge active={policy.active} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-500">{formatDateTime(policy.updatedAt)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {!loading && filtered.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <FileText aria-hidden="true" className="mx-auto mb-3 size-8 text-slate-300" />
                  <p className="font-semibold text-slate-800">{policies.length === 0 ? 'Chưa có điều khoản nào' : 'Không có điều khoản khớp bộ lọc'}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {policies.length === 0 ? 'Tạo điều khoản đầu tiên để gắn vào tour và hiển thị trên website.' : 'Thử đổi từ khoá hoặc bỏ bớt bộ lọc.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Detail panel */}
        <section aria-labelledby="policy-detail-title" className="min-w-0 rounded-2xl border border-slate-200 bg-white xl:sticky xl:top-5">
          {!selected ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <FileText aria-hidden="true" className="mb-3 size-8 text-[#0B7058]" />
              <h2 id="policy-detail-title" className="text-lg font-semibold text-slate-900">
                Chọn một điều khoản
              </h2>
              <p className="mt-1 text-sm text-slate-500">Chọn một dòng trong danh sách để xem nội dung và lịch sử phiên bản.</p>
            </div>
          ) : (
            <>
              <header className="space-y-3 border-b border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 id="policy-detail-title" className="break-words text-xl font-bold text-slate-900">
                      {selected.title}
                    </h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                      <code className="font-mono text-xs">{selected.code}</code>
                      <span aria-hidden="true">·</span>
                      <span>{POLICY_KIND_LABELS[selected.kind] ?? selected.kind}</span>
                    </p>
                  </div>
                  <ActiveBadge active={selected.active} />
                </div>

                {selectedPublicDocument && (
                  <a
                    href={policyDocumentPath(selectedPublicDocument)}
                    onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); navigateTo(policyDocumentPath(selectedPublicDocument)); }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-800 hover:underline"
                  >
                    <Globe aria-hidden="true" className="size-4" />
                    Đang hiển thị ở trang “{selectedPublicDocument.label}”
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={buttonClass.primary}
                    disabled={!selected.active || versionsLoading}
                    title={selected.active ? undefined : 'Kích hoạt lại để phát hành phiên bản mới'}
                    onClick={() => { setModalError(''); setEditor('publish'); }}
                  >
                    <Plus aria-hidden="true" className="size-4" /> Phiên bản mới
                  </button>
                  <button type="button" className={buttonClass.outline} onClick={() => openAction({ type: 'status', policy: selected })}>
                    {selected.active ? 'Ngừng áp dụng' : 'Kích hoạt lại'}
                  </button>
                  <button type="button" className={`${buttonClass.dangerGhost} ml-auto`} onClick={() => openAction({ type: 'delete', policy: selected })}>
                    Xoá
                  </button>
                </div>
                {!selected.active && (
                  <p className="text-xs text-slate-500">Điều khoản đang ngừng áp dụng: không gắn được vào tour mới và không phát hành được phiên bản mới.</p>
                )}
              </header>

              {versionsLoading ? (
                <div className="space-y-3 p-5" aria-busy="true">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
                </div>
              ) : versionsError ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <p role="alert" className="text-sm text-rose-800">
                    {versionsError}
                  </p>
                  <button type="button" className={buttonClass.outline} onClick={() => void loadVersions(selected.id)}>
                    <RefreshCw aria-hidden="true" className="size-4" /> Thử lại
                  </button>
                </div>
              ) : versions.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">Điều khoản chưa có phiên bản nào.</p>
              ) : (
                <>
                  {!current && (
                    <p className="mx-5 mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Chưa có phiên bản nào đang hiệu lực. {selectedPublicDocument ? 'Trang website sẽ báo chưa công bố.' : ''}
                    </p>
                  )}

                  {viewed && (
                    <article className="space-y-4 p-5" aria-label={`Phiên bản ${viewed.versionNumber}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">Phiên bản v{viewed.versionNumber}</h3>
                          <VersionStatusBadge status={versionStatusOf(viewed, current)} />
                        </div>
                        {!viewed.revokedAt && (
                          <button
                            type="button"
                            className={`${buttonClass.dangerGhost} min-h-9 text-xs`}
                            onClick={() => openAction({ type: 'revoke', policy: selected, version: viewed })}
                          >
                            Thu hồi phiên bản
                          </button>
                        )}
                      </div>

                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <dt className="text-xs text-slate-500">Có hiệu lực từ</dt>
                          <dd className="tabular-nums text-slate-900">{formatDateTime(viewed.effectiveFrom)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">Phát hành lúc</dt>
                          <dd className="tabular-nums text-slate-900">{formatDateTime(viewed.approvedAt)}</dd>
                        </div>
                        {viewed.revokedAt && (
                          <div className="col-span-2 rounded-xl bg-rose-50 px-3 py-2 text-rose-900">
                            <dt className="text-xs">Thu hồi lúc {formatDateTime(viewed.revokedAt)}</dt>
                            <dd className="mt-0.5 break-words">{viewed.revocationReason || '—'}</dd>
                          </div>
                        )}
                      </dl>

                      {viewed.refundTiers && viewed.refundTiers.length > 0 && (
                        <div className="rounded-xl border border-slate-200 px-4 py-3">
                          <h4 className="mb-1 text-sm font-semibold text-slate-800">Bậc hoàn tiền</h4>
                          <RefundTierTable tiers={viewed.refundTiers} />
                        </div>
                      )}

                      <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-[#FAF8F5] px-4 py-3 text-sm leading-relaxed text-slate-800">
                        {viewed.content}
                      </div>
                    </article>
                  )}

                  <div className="border-t border-slate-100 p-5">
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Lịch sử phiên bản</h3>
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {versions.map((version) => {
                        const isViewed = viewed?.id === version.id;
                        return (
                          <li key={version.id}>
                            <button
                              type="button"
                              aria-current={isViewed ? 'true' : undefined}
                              onClick={() => setViewedVersionId(version.id)}
                              className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0B7058] ${
                                isViewed ? 'bg-[#F3FAF7]' : ''
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <span className="w-9 shrink-0 font-semibold tabular-nums text-slate-900">v{version.versionNumber}</span>
                                <span className="truncate tabular-nums text-slate-500">từ {formatDateTime(version.effectiveFrom)}</span>
                              </span>
                              <VersionStatusBadge status={versionStatusOf(version, current)} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>

      {/* Create policy */}
      <Modal
        isOpen={editor === 'create'}
        onClose={() => setEditor(null)}
        preventClose={busy}
        maxWidth="3xl"
        title="Tạo điều khoản"
        subtitle="Tạo điều khoản cùng phiên bản đầu tiên."
      >
        {editor === 'create' && (
          <PolicyVersionForm
            kind={newKind}
            busy={busy}
            submitLabel="Tạo điều khoản"
            onCancel={() => setEditor(null)}
            onSubmit={createPolicy}
            validateHeader={() => (newTitle.trim() ? null : 'Vui lòng nhập tiêu đề điều khoản.')}
            header={
              <>
                {modalError && (
                  <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {modalError}
                  </p>
                )}
                <label className="block">
                  <FieldLabel>
                    Tiêu đề <span className="text-rose-700">*</span>
                  </FieldLabel>
                  <input className={fieldClass} maxLength={250} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <FieldLabel>
                      Loại <span className="text-rose-700">*</span>
                    </FieldLabel>
                    <select className={fieldClass} value={newKind} onChange={(e) => setNewKind(e.target.value as PolicyKind)}>
                      {(Object.keys(POLICY_KIND_LABELS) as PolicyKind[]).map((kind) => (
                        <option key={kind} value={kind}>
                          {POLICY_KIND_LABELS[kind]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <FieldLabel hint="Để trống để tự tạo">Mã tham chiếu</FieldLabel>
                    <input
                      className={`${fieldClass} font-mono`}
                      maxLength={80}
                      value={newCode}
                      placeholder="VD: REFUND_POLICY"
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    />
                  </label>
                </div>
                {missingPublicDocuments.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs text-slate-500">Dùng mã của trang website để nội dung hiện ở footer:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {missingPublicDocuments.map((document) => (
                        <button
                          key={document.code}
                          type="button"
                          aria-pressed={newCode === document.code}
                          className="cursor-pointer rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 aria-pressed:border-[#0B7058] aria-pressed:bg-[#E7F4F0] aria-pressed:text-[#0B7058]"
                          onClick={() => {
                            setNewCode(document.code);
                            if (!newTitle.trim()) setNewTitle(document.label);
                            setNewKind(PUBLIC_DOCUMENT_KINDS[document.code] ?? 'general');
                          }}
                        >
                          {document.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            }
          />
        )}
      </Modal>

      {/* Publish new version */}
      <Modal
        isOpen={editor === 'publish' && Boolean(selected)}
        onClose={() => setEditor(null)}
        preventClose={busy}
        maxWidth="3xl"
        title="Phát hành phiên bản mới"
        subtitle={selected ? `${selected.title} · v${(versions[0]?.versionNumber ?? 0) + 1}` : undefined}
      >
        {editor === 'publish' && selected && (
          <PolicyVersionForm
            kind={selected.kind}
            initialContent={latestLive?.content ?? ''}
            initialTiers={latestLive?.refundTiers}
            previousEffectiveFrom={latestLive?.effectiveFrom}
            busy={busy}
            submitLabel="Phát hành"
            onCancel={() => setEditor(null)}
            onSubmit={publishVersion}
            header={
              <>
                {modalError && (
                  <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {modalError}
                  </p>
                )}
                <p className="rounded-xl bg-[#E6F2EF] px-4 py-3 text-sm text-slate-800">
                  Nội dung bên dưới chép từ phiên bản gần nhất để sửa tiếp. Booking đã tạo vẫn giữ phiên bản lúc đặt.
                </p>
              </>
            }
          />
        )}
      </Modal>

      {/* Status / revoke / delete */}
      <Modal
        isOpen={Boolean(action)}
        onClose={() => setAction(null)}
        preventClose={busy}
        maxWidth="lg"
        title={
          action?.type === 'delete'
            ? 'Xoá điều khoản'
            : action?.type === 'revoke'
              ? `Thu hồi phiên bản v${action.version.versionNumber}`
              : action?.policy.active
                ? 'Ngừng áp dụng điều khoản'
                : 'Kích hoạt lại điều khoản'
        }
      >
        {action && (
          <form onSubmit={confirmAction} className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-700">
              {action.type === 'delete' && (
                <>
                  Xoá “<strong>{action.policy.title}</strong>” khỏi danh sách. Không thể hoàn tác. Booking đã tạo vẫn giữ điều khoản lúc đặt.
                  {publicDocumentOf(action.policy.code) && ' Trang website tương ứng sẽ báo chưa công bố.'}
                </>
              )}
              {action.type === 'revoke' &&
                'Phiên bản bị thu hồi sẽ không còn hiệu lực với booking mới. Nếu đây là bản đang hiệu lực, điều khoản sẽ không có bản nào hiệu lực cho tới khi phát hành bản mới.'}
              {action.type === 'status' &&
                (action.policy.active
                  ? 'Điều khoản sẽ không gắn được vào tour mới. Booking đã tạo vẫn giữ điều khoản lúc đặt.'
                  : 'Điều khoản sẽ dùng lại được cho tour và phát hành phiên bản mới.')}
            </p>
            {action.type !== 'delete' && (
              <label className="block">
                <FieldLabel>
                  Lý do <span className="text-rose-700">*</span>
                </FieldLabel>
                <textarea autoFocus className={`${fieldClass} min-h-24`} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
              </label>
            )}
            {modalError && (
              <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {modalError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" className={buttonClass.outline} onClick={() => setAction(null)} disabled={busy}>
                Đóng
              </button>
              <button
                type="submit"
                className={action.type === 'status' && !action.policy.active ? buttonClass.primary : buttonClass.danger}
                disabled={busy}
              >
                {busy
                  ? 'Đang xử lý…'
                  : action.type === 'delete'
                    ? 'Xoá điều khoản'
                    : action.type === 'revoke'
                      ? 'Thu hồi'
                      : action.policy.active
                        ? 'Ngừng áp dụng'
                        : 'Kích hoạt lại'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
