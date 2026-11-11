export type PolicyKind = 'cancellation' | 'payment' | 'general';

export interface RefundTier {
  minHoursBeforeDeparture: number;
  refundPercent: number;
}

export interface AdminPolicy {
  id: number;
  code: string;
  title: string;
  kind: PolicyKind;
  active: boolean;
  versionNumber: number | null;
  updatedAt: string | null;
}

export interface AdminPolicyVersion {
  id: number;
  policyId: number;
  policyCode: string;
  title: string;
  versionNumber: number;
  content: string;
  effectiveFrom: string;
  approvedBy: number | null;
  approvedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  kind: PolicyKind;
  refundTiers: RefundTier[] | null;
}

export interface PolicyCreateRequest {
  code: string;
  title: string;
  kind: PolicyKind;
}

export interface PolicyPublishRequest {
  content: string;
  effectiveFrom: string;
  refundTiers?: RefundTier[] | null;
}

export type PolicyVersionStatus = 'current' | 'scheduled' | 'superseded' | 'revoked';

export const POLICY_KIND_LABELS: Record<PolicyKind, string> = {
  general: 'Lưu ý chung',
  payment: 'Thanh toán / phụ thu',
  cancellation: 'Đổi / huỷ',
};

/**
 * Mirrors the backend's effective-version rule: the newest approved version whose effectiveFrom
 * has passed is in force, unless it was revoked. Versions revoked before they took effect are skipped.
 */
export function currentVersionOf(versions: AdminPolicyVersion[], now = Date.now()): AdminPolicyVersion | undefined {
  const started = [...versions]
    .sort((a, b) => b.versionNumber - a.versionNumber)
    .filter((v) => new Date(v.effectiveFrom).getTime() <= now && (!v.approvedAt || new Date(v.approvedAt).getTime() <= now))
    .filter((v) => !v.revokedAt || new Date(v.revokedAt).getTime() >= new Date(v.effectiveFrom).getTime());
  const latest = started[0];
  return latest && !latest.revokedAt ? latest : undefined;
}

export function versionStatusOf(version: AdminPolicyVersion, current: AdminPolicyVersion | undefined, now = Date.now()): PolicyVersionStatus {
  if (version.revokedAt) return 'revoked';
  if (new Date(version.effectiveFrom).getTime() > now) return 'scheduled';
  if (current?.id === version.id) return 'current';
  return 'superseded';
}
