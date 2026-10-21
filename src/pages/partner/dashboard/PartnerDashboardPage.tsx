import React from 'react';
import { ScreenId } from '../../../types/expedition';
import { useI18n } from '../../../i18n/I18nProvider';
import { partnerApplicationsApi } from '../../../features/partners/api/partnerApplications.api';

export interface PartnerDashboardPageProps {
  onNavigate?: (screen: ScreenId) => void;
}

const regions = [
  ['fansipan', 'partner.regionFansipan'],
  ['hagiang', 'partner.regionHaGiang'],
  ['bachmoc', 'partner.regionBachMoc'],
  ['langbiang', 'partner.regionLangBiang'],
  ['phongnha', 'partner.regionPhongNha'],
] as const;

export const PartnerDashboardPage: React.FC<PartnerDashboardPageProps> = ({ onNavigate }) => {
  const { t } = useI18n();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    setSubmitting(true);
    setError('');
    try {
      await partnerApplicationsApi.apply({
        businessName: String(form.get('businessName') ?? ''),
        taxCode: String(form.get('taxCode') ?? ''),
        businessType: String(form.get('businessType') ?? '') || undefined,
        foundedYear: Number(form.get('startYear')) || undefined,
        address: String(form.get('address') ?? '') || undefined,
        contactName: String(form.get('contactName') ?? ''),
        email,
        phone: String(form.get('phone') ?? ''),
        tourRegions: form.getAll('tourAreas').map(String),
        safetyRulesAccepted: form.get('safetyRulesAgreement') === 'on',
        description: String(form.get('about') ?? '') || undefined,
      });
      try {
        sessionStorage.setItem('wetrek_partner_activation_email', email);
        sessionStorage.setItem('wetrek_partner_application_email', email.toLowerCase());
      } catch { /* Continue without saving the email for this browser session. */ }
      onNavigate?.('partner_application_submitted');
    } catch (cause) {
      setError(getApplicationError(cause, t('partner.applicationError'), t('partner.applicationDuplicateEmail'), t('partner.applicationDuplicateTaxCode')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[70vh] bg-[#F7F8F6] px-4 py-10 text-[#1C2526] md:px-8 md:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('partner.title')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52605D]">{t('partner.intro')}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-7 rounded-xl border border-[#E2E7E4] bg-white p-5 shadow-sm md:p-8">
          <section aria-labelledby="partner-business-heading" className="space-y-5">
            <div>
              <h2 id="partner-business-heading" className="text-lg font-semibold">{t('partner.businessSection')}</h2>
              <p className="mt-1 text-sm text-[#64716D]">{t('partner.businessHelp')}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="partner-business-name" label={t('partner.businessName')} required>
                <input id="partner-business-name" name="businessName" required autoComplete="organization" className={inputClass} />
              </Field>
              <Field id="partner-tax-code" label={t('partner.taxCode')} required>
                <input id="partner-tax-code" name="taxCode" required className={inputClass} />
              </Field>
              <Field id="partner-business-type" label={t('partner.businessType')}>
                <select id="partner-business-type" name="businessType" defaultValue="" className={inputClass}>
                  <option value="" disabled>{t('partner.chooseOne')}</option>
                  <option value="company">{t('partner.typeCompany')}</option>
                  <option value="household">{t('partner.typeHousehold')}</option>
                  <option value="other">{t('partner.typeOther')}</option>
                </select>
              </Field>
              <Field id="partner-founded" label={t('partner.startYear')}>
                <input id="partner-founded" name="startYear" type="number" min="1900" max="2100" inputMode="numeric" className={inputClass} />
              </Field>
              <Field id="partner-address" label={t('partner.address')} className="sm:col-span-2">
                <input id="partner-address" name="address" autoComplete="street-address" className={inputClass} />
              </Field>
            </div>
          </section>

          <section aria-labelledby="partner-contact-heading" className="space-y-5 border-t border-[#E6EAE7] pt-6">
            <div>
              <h2 id="partner-contact-heading" className="text-lg font-semibold">{t('partner.contactSection')}</h2>
              <p className="mt-1 text-sm text-[#64716D]">{t('partner.contactHelp')}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="partner-contact-name" label={t('partner.contactName')} required>
                <input id="partner-contact-name" name="contactName" required autoComplete="name" className={inputClass} />
              </Field>
              <Field id="partner-email" label={t('partner.email')} required>
                <input id="partner-email" name="email" type="email" required autoComplete="email" className={inputClass} />
              </Field>
              <Field id="partner-phone" label={t('partner.phone')} required>
                <input id="partner-phone" name="phone" type="tel" required autoComplete="tel" className={inputClass} />
              </Field>
            </div>
          </section>

          <section aria-labelledby="partner-area-heading" className="space-y-4 border-t border-[#E6EAE7] pt-6">
            <div>
              <h2 id="partner-area-heading" className="text-lg font-semibold">{t('partner.tourAreas')}</h2>
              <p className="mt-1 text-sm text-[#64716D]">{t('partner.tourAreasHelp')}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {regions.map(([value, labelKey]) => (
                <label key={value} className="flex items-center gap-3 rounded-md border border-[#E2E7E4] px-3 py-2.5 text-sm hover:bg-[#F7F8F6]">
                  <input type="checkbox" name="tourAreas" value={value} className="h-4 w-4 accent-[#1F4E43]" />
                  {t(labelKey)}
                </label>
              ))}
            </div>
          </section>

          <section aria-labelledby="partner-safety-heading" className="space-y-4 border-t border-[#E6EAE7] pt-6">
            <div>
              <h2 id="partner-safety-heading" className="text-lg font-semibold">{t('partner.safetyTitle')}</h2>
              <p className="mt-1 text-sm text-[#64716D]">{t('partner.safetyHelp')}</p>
            </div>
            <label className="flex items-start gap-3 rounded-md border border-[#E2E7E4] bg-[#F7F8F6] p-4 text-sm leading-6 text-[#263330]">
              <input type="checkbox" name="safetyRulesAgreement" required className="mt-1 h-4 w-4 shrink-0 accent-[#1F4E43]" />
              <span>{t('partner.safetyAgreement')} <span aria-hidden="true" className="text-red-700">*</span></span>
            </label>
          </section>

          <Field id="partner-about" label={t('partner.about')}>
            <textarea id="partner-about" name="about" rows={4} maxLength={1000} placeholder={t('partner.aboutPlaceholder')} className={inputClass} />
          </Field>

          <div className="border-t border-[#E6EAE7] pt-5">
            {error && <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-md bg-[#1F4E43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#173C34] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] sm:w-auto">
              {submitting ? t('partner.sending') : t('partner.submit')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

function Field({ id, label, required, className = '', children }: {
  id: string;
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#263330]">
        {label}{required && <span aria-hidden="true" className="ml-1 text-red-700">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full rounded-md border border-[#CAD4CF] bg-white px-3 py-2.5 text-sm text-[#1C2526] placeholder:text-[#7A8581] focus:border-[#1F4E43] focus:outline-none focus:ring-2 focus:ring-[#1F4E43]/15';

export default PartnerDashboardPage;

function getApplicationError(error: unknown, fallback: string, duplicateEmail: string, duplicateTaxCode: string) {
  const response = error && typeof error === 'object' ? error as { code?: unknown; message?: unknown } : {};
  const code = typeof response.code === 'string' ? response.code : '';
  const message = typeof response.message === 'string' ? response.message : '';
  if (code === 'PARTNER_APPLICATION_EXISTS') {
    if (/email/i.test(message) || /email/i.test(JSON.stringify(error))) return duplicateEmail;
    if (/thuế|tax/i.test(message) || /thuế|tax/i.test(JSON.stringify(error))) return duplicateTaxCode;
  }
  return message || fallback;
}
