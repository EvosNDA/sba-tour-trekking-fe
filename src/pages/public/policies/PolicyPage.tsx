import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { navigateTo } from '../../../lib/navigation';
import { APP_CONFIG } from '../../../constants/config';
import { policiesApi, type PublicPolicyResponse } from '../../../features/policies/api/policies.api';
import { POLICY_DOCUMENTS, policyDocumentPath, type PolicyDocument } from '../../../features/policies/policy-documents';
import type { ApiError } from '../../../types/api.types';

interface PolicyPageProps {
  document: PolicyDocument;
}

const handleInAppLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  navigateTo(event.currentTarget.getAttribute('href') || ROUTES.PUBLIC.HOME);
};

export const PolicyPage: React.FC<PolicyPageProps> = ({ document: policyDocument }) => {
  const [policy, setPolicy] = useState<PublicPolicyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${policyDocument.label} | WeTrek`;
    return () => { document.title = previousTitle; };
  }, [policyDocument.label]);

  useEffect(() => {
    const controller = new AbortController();
    setPolicy(null);
    setError(null);
    setIsLoading(true);

    policiesApi.readPublic(policyDocument.code, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPolicy(result);
      })
      .catch((reason: ApiError) => {
        if (!controller.signal.aborted) setError(reason);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [policyDocument.code, reloadKey]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
      <a href={ROUTES.PUBLIC.HOME} onClick={handleInAppLink} className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-[#0F4C3A] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F4C3A]">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Về trang chủ
      </a>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="Điều khoản và chính sách" className="border-y border-[#E6E1D8]">
          <ul className="divide-y divide-[#E6E1D8]">
            {POLICY_DOCUMENTS.map((item) => (
              <li key={item.code}>
                <a
                  href={policyDocumentPath(item)}
                  onClick={handleInAppLink}
                  aria-current={item.code === policyDocument.code ? 'page' : undefined}
                  className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm text-stone-600 transition-colors hover:text-[#0F4C3A] aria-[current=page]:font-semibold aria-[current=page]:text-[#0F4C3A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F4C3A]"
                >
                  {item.label}
                  {item.code === policyDocument.code && <ArrowRight aria-hidden="true" className="size-4 shrink-0" />}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="policy-title" aria-busy={isLoading} className="min-w-0">
          <h1 id="policy-title" className="text-balance font-editorial text-3xl font-bold text-[#1C2526] sm:text-4xl">
            {policy?.title || policyDocument.label}
          </h1>

          {isLoading && <p role="status" className="mt-6 text-base text-stone-600">Đang tải nội dung…</p>}

          {!isLoading && error && (
            <div className="mt-6 space-y-4 text-base leading-relaxed text-stone-600">
              <p role="alert">
                {error.status === 404
                  ? 'Tài liệu này hiện chưa được công bố hoặc đã ngừng áp dụng.'
                  : 'Chưa tải được nội dung. Vui lòng thử lại sau.'}
              </p>
              {error.status !== 404 && (
                <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#0F4C3A] px-5 text-sm font-semibold text-white hover:bg-[#0B3B2D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F4C3A]">
                  <RefreshCw aria-hidden="true" className="size-4" /> Thử lại
                </button>
              )}
              <p>
                Liên hệ <a className="rounded-sm font-medium text-[#0F4C3A] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F4C3A]" href={`mailto:${APP_CONFIG.SUPPORT_EMAIL}`}>{APP_CONFIG.SUPPORT_EMAIL}</a> để được hỗ trợ.
              </p>
            </div>
          )}

          {!isLoading && !error && policy && (
            <>
              <p className="mt-4 text-sm text-stone-500">
                Phiên bản {policy.versionNumber} · Có hiệu lực từ {new Date(policy.effectiveFrom).toLocaleDateString('vi-VN')}
              </p>
              <div className="mt-8 max-w-prose whitespace-pre-wrap break-words text-pretty text-base leading-8 text-stone-700">
                {policy.content}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
