import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { ScreenId } from '../../types/expedition';

export const Footer: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({ onNavigate }) => {
  const { t } = useI18n();
  const browseTours = () => {
    onNavigate('marketplace');
    window.setTimeout(() => document.getElementById('tour-list')?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  return (
    <footer className="bg-[#F7F4EE] border-t border-[#E6E1D8] mt-16 text-[#1C2526]">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <h3 className="font-editorial text-lg font-bold text-[#C2410C] mb-2">WeTrek</h3>
          <p className="text-[#64748B] leading-relaxed">{t('footer.description')}</p>
        </div>
        <div>
          <h4 className="font-bold mb-3">{t('footer.travelers')}</h4>
          <ul className="space-y-2 text-[#64748B]">
            <li><button onClick={browseTours} className="hover:text-[#1C2526]">{t('header.findTours')}</button></li>
            <li><button onClick={() => onNavigate('registration')} className="hover:text-[#1C2526]">{t('auth.createAccount')}</button></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3">{t('footer.partners')}</h4>
          <ul className="space-y-2 text-[#64748B]">
            <li><button onClick={() => onNavigate('partner_company_info')} className="hover:text-[#1C2526]">{t('auth.createAccount')}</button></li>
            <li><button onClick={() => onNavigate('login')} className="hover:text-[#1C2526]">{t('header.signIn')}</button></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#E6E1D8] py-4 px-4 md:px-8 text-[11px] text-[#78716C] font-mono">
        <div className="max-w-6xl mx-auto">© 2026 WeTrek</div>
      </div>
    </footer>
  );
};
