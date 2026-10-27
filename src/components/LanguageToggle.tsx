import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="inline-flex items-center rounded-md border border-[#E6E1D8] bg-white p-0.5 text-[11px]" aria-label={t('auth.language')}>
      {(['vi', 'en'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          aria-pressed={language === option}
          className={`rounded px-2 py-1 font-semibold ${language === option ? 'bg-[#1F4E43] text-white' : 'text-[#64748B]'}`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
