import React from 'react';
import { authApi } from '../../../features/auth/api/auth.api';
import { useAuthStore, authStore } from '../../../stores/auth.store';
import { useI18n } from '../../../i18n/I18nProvider';

export default function AccountProfilePage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [fullName, setFullName] = React.useState(user?.name ?? '');
  const [phone, setPhone] = React.useState(user?.phone ?? '');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [hasError, setHasError] = React.useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage('');
    setHasError(false);
    try {
      const profile = await authApi.updateMe({ fullName, phone });
      authStore.updateUser({ name: profile.fullName, phone: profile.phone });
      setFullName(profile.fullName);
      setPhone(profile.phone ?? '');
      setMessage(t('account.saved'));
    } catch {
      setHasError(true);
      setMessage(t('account.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="min-h-[65vh] bg-[#FDFBF7] px-4 py-8 text-[#1C2526] md:px-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">{t('account.section')}</p>
          <h1 className="mt-2 font-editorial text-3xl font-bold">{t('account.profileTitle')}</h1>
          <p className="mt-2 text-sm text-[#64748B]">{t('account.profileDescription')}</p>
        </header>

        <form onSubmit={save} className="space-y-5 rounded-xl border border-[#E6E1D8] bg-white p-5 shadow-sm md:p-7">
          <div>
            <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium">{t('account.email')}</label>
            <input id="profile-email" type="email" value={user?.email ?? ''} readOnly aria-describedby="profile-email-help"
              className="w-full rounded-md border border-[#E6E1D8] bg-[#F7F4EE] px-3 py-2.5 text-sm text-[#64748B]" />
            <p id="profile-email-help" className="mt-1.5 text-xs text-[#78716C]">{t('account.emailReadOnly')}</p>
          </div>
          <div>
            <label htmlFor="profile-full-name" className="mb-1.5 block text-sm font-medium">{t('account.fullName')}</label>
            <input id="profile-full-name" required maxLength={200} autoComplete="name" value={fullName}
              onChange={event => setFullName(event.target.value)}
              className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2.5 text-sm focus:border-[#C2410C] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/20" />
          </div>
          <div>
            <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-medium">{t('account.phone')}</label>
            <input id="profile-phone" type="tel" maxLength={30} autoComplete="tel" value={phone ?? ''}
              onChange={event => setPhone(event.target.value)}
              className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2.5 text-sm focus:border-[#C2410C] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/20" />
          </div>
          <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#E6E1D8] pt-5 sm:flex-row sm:items-center">
            {message ? <p role={hasError ? 'alert' : 'status'} className={`text-sm ${hasError ? 'text-red-700' : 'text-[#1F4E43]'}`}>{message}</p> : <span />}
            <button type="submit" disabled={saving} className="rounded-md bg-[#1F4E43] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#173C34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] disabled:cursor-wait disabled:opacity-60">
              {saving ? t('account.saving') : t('account.save')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
