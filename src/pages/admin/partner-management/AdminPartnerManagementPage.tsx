import React, { useState } from 'react';
import { ScreenId } from '../../../types/expedition';
import { useI18n } from '../../../i18n/I18nProvider';

export interface AdminPartnerManagementPageProps {
  onNavigate?: (screen: ScreenId) => void;
}

export const AdminPartnerManagementPage: React.FC<AdminPartnerManagementPageProps> = ({
  onNavigate = () => {},
}) => {
  const { t } = useI18n();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('daily');
  const [regionFilter, setRegionFilter] = useState<'all' | 'sapa' | 'hagiang' | 'dalat' | 'phongnha'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; title: string; desc: string }>({
    show: false,
    title: '',
    desc: '',
  });

  const showToast = (title: string, desc: string) => {
    setToast({ show: true, title, desc });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast(t('adminStats.notConnectedTitle'), t('adminStats.notConnectedStats'));
    }, 750);
  };

  const handleExport = () => {
    showToast(t('adminStats.notConnectedTitle'), t('adminStats.notConnectedExport'));
  };

  return (
    <div className="w-full bg-[#F7F8F6] text-[#1C2526] min-h-screen font-sans flex">
      {/* Ops Sidebar (~64 w) */}
      <aside className="hidden lg:flex w-64 bg-[#F7F8F6] border-r border-[#E2E7E4] flex-col justify-between py-6 shrink-0 z-20">
        <div className="flex flex-col gap-6">
          <div className="px-6 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#173C34] flex items-center justify-center text-white font-bold text-sm">
              ⛰
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#1C2526] tracking-tight leading-none">
                SummitTrails
              </span>
              <span className="font-mono text-[10px] text-[#64716D] uppercase tracking-wider mt-1">
                {t('adminNav.operationsConsole')}
              </span>
            </div>
          </div>

          <div className="px-3">
            <span className="px-3 font-mono text-[10px] text-[#64716D] uppercase tracking-wider font-bold">
              {t('adminNav.operationsLinks')}
            </span>
            <nav className="flex flex-col gap-1 mt-2">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1F4E43] text-white font-semibold text-xs text-left cursor-pointer shadow-xs"
              >
                <span>📊</span>
                <span>{t('adminNav.overview')}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('staff_escalations')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#64716D] hover:bg-[#EEF2EF] hover:text-[#1C2526] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>💬</span>
                <span>{t('adminNav.liveChats')}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ops_moderation')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#64716D] hover:bg-[#EEF2EF] hover:text-[#1C2526] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🗺</span>
                <span>{t('adminNav.tourSubmissions')}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('partner_company_info')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#64716D] hover:bg-[#EEF2EF] hover:text-[#1C2526] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🛡</span>
                <span>{t('adminNav.partnerReview')}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#64716D] hover:bg-[#EEF2EF] hover:text-[#1C2526] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🏪</span>
                <span>{t('adminNav.marketplace')}</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="px-3">
          <div className="p-2.5 rounded-xl bg-white border border-[#E2E7E4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1F4E43]"></span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#1C2526]">{t('adminNav.sampleData')}</span>
                <span className="font-mono text-[9px] text-[#1F4E43]">NODE-VN-07 // 99.98%</span>
              </div>
            </div>
            <span className="text-[#1F4E43] text-xs">📡</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E7E4] z-30 flex items-center justify-between px-6 sticky top-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#64716D]">
              <span>{t('adminNav.staffWorkspaces')}</span>
              <span>›</span>
              <span className="font-bold text-[#1C2526]">{t('adminStats.title')}</span>
            </div>
            <div className="h-4 w-px bg-[#E2E7E4] hidden md:block"></div>
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F2EC] text-[#00201a]">
              <span className="w-2 h-2 rounded-full bg-[#1F4E43] animate-pulse"></span>
              <span className="font-mono text-[11px] font-bold">{t('adminNav.sampleMetrics')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-xs text-[#64716D] px-2.5 py-1 rounded bg-[#F7F8F6] border border-[#E2E7E4]">
              <span>🌐</span>
              <span className="font-mono text-[11px]">{t('adminNav.sampleLocation')}</span>
            </div>
            <div className="h-6 w-px bg-[#E2E7E4]"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#173C34] text-white flex items-center justify-center font-bold text-xs">
                KV
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-[#1C2526] leading-tight">K. Vance</span>
                <span className="font-mono text-[10px] text-[#64716D]">{t('adminNav.operationsLead')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 xl:p-8">
          <p role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('adminStats.sampleDataNote')}</p>
          {/* Section 1: Page Header & Time-Range Strip */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#173C34] font-mono text-[11px] uppercase font-bold tracking-widest">
                <span>📈</span>
                <span>{t('adminStats.eyebrow')}</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#1C2526] font-bold">
                {t('adminStats.title')}
              </h1>
              <p className="text-xs sm:text-sm text-[#64716D]">
                {t('adminStats.description')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#F7F8F6] text-[#1C2526] text-xs font-bold transition-colors border border-[#E2E7E4] shadow-xs cursor-pointer"
              >
                <span>📥</span>
                <span>{t('adminStats.export')}</span>
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1F4E43] hover:bg-[#173C34] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                <span>{isRefreshing ? t('adminStats.refreshing') : t('adminStats.refresh')}</span>
              </button>
            </div>
          </div>

          {/* Time Filter Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-1.5 bg-[#E8ECE9] rounded-lg border border-[#E2E7E4]">
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'today'
                    ? 'bg-[#1F4E43] text-white shadow-xs'
                    : 'text-[#64716D] hover:text-[#1C2526]'
                }`}
              >
                <span>{t('adminStats.today')}</span>
                <span className="px-1.5 py-0.2 rounded bg-black/20 font-mono text-[10px]">
                  142 Hikers
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'week'
                    ? 'bg-[#1F4E43] text-white shadow-xs'
                    : 'text-[#64716D] hover:text-[#1C2526]'
                }`}
              >
                <span>{t('adminStats.week')}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#E2E7E4] text-[#1C2526] font-mono text-[10px]">
                  1,085 Hikers
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'month'
                    ? 'bg-[#1F4E43] text-white shadow-xs'
                    : 'text-[#64716D] hover:text-[#1C2526]'
                }`}
              >
                <span>{t('adminStats.month')}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#E2E7E4] text-[#1C2526] font-mono text-[10px]">
                  4,920 Hikers
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'year'
                    ? 'bg-[#1F4E43] text-white shadow-xs'
                    : 'text-[#64716D] hover:text-[#1C2526]'
                }`}
              >
                <span>{t('adminStats.year')}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#E2E7E4] text-[#1C2526] font-mono text-[10px]">
                  42,800 Hikers
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-[#1C2526] text-xs font-semibold shadow-xs border border-[#E2E7E4]">
              <span>📅</span>
              <span className="font-mono text-xs">Nov 1 - Nov 18, 2026</span>
            </div>
          </div>

          {/* Section 2: 4 Primary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#E2E7E4] flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[#64716D]">
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
                    {t('adminStats.totalHikers')}
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#F7F8F6] text-[#1F4E43] text-xs font-bold">
                    🥾
                  </span>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-serif text-3xl font-bold text-[#1C2526]">142</span>
                  <span className="text-xs text-[#64716D]">{t('adminStats.today')}</span>
                  <span className="ml-auto inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#E7F2EC] text-[#00201a] font-mono text-[10px] font-bold">
                    ↑ +18.4%
                  </span>
                </div>
              </div>
              <div className="pt-4 space-y-1.5">
                <div className="h-6 flex items-end gap-1 px-1 py-0.5 bg-[#F7F8F6] rounded border border-[#E2E7E4]">
                  <div className="w-1/6 bg-[#a0d0c2] rounded-t h-2"></div>
                  <div className="w-1/6 bg-[#a0d0c2] rounded-t h-3"></div>
                  <div className="w-1/6 bg-[#E7F2EC] rounded-t h-4"></div>
                  <div className="w-1/6 bg-[#1F4E43] rounded-t h-5"></div>
                  <div className="w-1/6 bg-[#1F4E43] rounded-t h-full"></div>
                  <div className="w-1/6 bg-[#a0d0c2] rounded-t h-3"></div>
                </div>
                <div className="flex justify-between items-center text-[#64716D] font-mono text-[10px]">
                  <span>W: 1,085</span>
                  <span>M: 4,920</span>
                  <span>Y: 42.8k</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#E2E7E4] flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[#64716D]">
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
                    {t('adminStats.grossBookings')}
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#F7F8F6] text-[#173C34] text-xs font-bold">
                    💳
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="font-mono text-xl font-bold text-[#1C2526]">
                    454,400,000 ₫
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#64716D]">{t('adminStats.usdToday')}</span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#E7F2EC] text-[#00201a] font-mono text-[10px] font-bold">
                    ↑ +12.6%
                  </span>
                </div>
              </div>
              <div className="pt-3 bg-[#F7F8F6] p-2 rounded-lg border border-[#E2E7E4] space-y-1">
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-[#64716D]">{t('adminStats.monthToDate')}</span>
                  <span className="text-[#1C2526] font-bold">15.74B ₫</span>
                </div>
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-[#64716D]">{t('adminStats.annualTotal')}</span>
                  <span className="text-[#1C2526] font-bold">136.9B ₫</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#E2E7E4] flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[#64716D]">
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
                    {t('adminStats.commission')}
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#F7F8F6] text-[#824500] text-xs font-bold">
                    🏦
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="font-mono text-xl font-bold text-[#173C34]">
                    45,440,000 ₫
                  </span>
                </div>
                <p className="text-[11px] text-[#64716D] leading-tight">
                  {t('adminStats.netRevenueHelp')}
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1.5 text-[#1F4E43] font-mono text-[11px] font-bold">
                <span>✓</span>
                <span>{t('adminStats.taxesReconciled')}</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#E2E7E4] flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[#64716D]">
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
                    {t('adminStats.activeTripsEscrow')}
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#F7F8F6] text-[#1F4E43] text-xs font-bold">
                    🔒
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="font-serif text-2xl font-bold text-[#1C2526]">{t('adminStats.activeCountLabel', { count: 38 })}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#64716D]">{t('adminStats.escrowHeld')}</span>
                  <span className="font-mono font-bold text-[#1F4E43]">1.24B ₫</span>
                </div>
              </div>
              <div className="pt-3 flex items-center justify-between p-2 rounded bg-[#F7F8F6] border border-[#E2E7E4]">
                <span className="text-xs font-bold text-[#64716D]">{t('adminStats.alertStatus')}</span>
                <span className="inline-flex items-center gap-1 text-xs text-[#1F4E43] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#1F4E43]"></span> {t('adminStats.noOpenIncidents')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Growth Chart */}
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-[#E2E7E4] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#E8ECE9]">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1C2526]">
                  {t('adminStats.growthTitle')}
                </h2>
                <p className="text-xs text-[#64716D]">
                  {t('adminStats.growthDescription')}
                </p>
              </div>

              {/* Chart Tabs */}
              <div className="flex items-center gap-1 bg-[#F7F8F6] p-1 rounded-lg border border-[#E2E7E4]">
                <button
                  type="button"
                  onClick={() => setChartPeriod('daily')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    chartPeriod === 'daily'
                      ? 'bg-white text-[#1C2526] shadow-xs'
                      : 'text-[#64716D] hover:text-[#1C2526]'
                  }`}
                >
                  {t('adminStats.daily')}
                </button>
                <button
                  type="button"
                  onClick={() => setChartPeriod('weekly')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    chartPeriod === 'weekly'
                      ? 'bg-white text-[#1C2526] shadow-xs'
                      : 'text-[#64716D] hover:text-[#1C2526]'
                  }`}
                >
                  {t('adminStats.weekly')}
                </button>
                <button
                  type="button"
                  onClick={() => setChartPeriod('monthly')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    chartPeriod === 'monthly'
                      ? 'bg-white text-[#1C2526] shadow-xs'
                      : 'text-[#64716D] hover:text-[#1C2526]'
                  }`}
                >
                  {t('adminStats.monthly')}
                </button>
                <button
                  type="button"
                  onClick={() => setChartPeriod('annual')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    chartPeriod === 'annual'
                      ? 'bg-white text-[#1C2526] shadow-xs'
                      : 'text-[#64716D] hover:text-[#1C2526]'
                  }`}
                >
                  {t('adminStats.annual')}
                </button>
              </div>
            </div>

            {/* SVG Data Visualization */}
            <div className="relative w-full h-64 bg-[#F7F8F6] rounded-xl p-4 flex flex-col justify-between overflow-hidden border border-[#E2E7E4]">
              <svg className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 240">
                <defs>
                  <linearGradient id="primaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#1F4E43" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#1F4E43" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="secondaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#1F4E43" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#1F4E43" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                <line x1="0" y1="40" x2="1000" y2="40" stroke="#E2E7E4" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="100" x2="1000" y2="100" stroke="#E2E7E4" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="160" x2="1000" y2="160" stroke="#E2E7E4" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="210" x2="1000" y2="210" stroke="#E2E7E4" strokeWidth="1" />

                {/* Secondary Line (Benchmark) */}
                <path
                  d="M0,190 Q120,175 250,150 T500,140 T750,110 T1000,95 L1000,240 L0,240 Z"
                  fill="url(#secondaryAreaGrad)"
                />
                <path
                  d="M0,190 Q120,175 250,150 T500,140 T750,110 T1000,95"
                  stroke="#1F4E43"
                  strokeDasharray="4 4"
                  strokeWidth="2"
                />

                {/* Primary Line (Today Velocity) */}
                <path
                  d="M0,200 Q150,190 280,120 T520,70 T740,110 T880,50 L1000,45 L1000,240 L0,240 Z"
                  fill="url(#primaryAreaGrad)"
                />
                <path
                  d="M0,200 Q150,190 280,120 T520,70 T740,110 T880,50 L1000,45"
                  stroke="#1F4E43"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />

                {/* Data Waypoint Circles */}
                <circle cx="520" cy="70" r="5" fill="#1F4E43" />
                <circle cx="520" cy="70" r="10" stroke="#1F4E43" strokeWidth="1.5" opacity="0.4" />
                <circle cx="880" cy="50" r="5" fill="#1F4E43" />
              </svg>

              {/* Floating HUD Overlays */}
              <div className="relative z-10 flex justify-between items-start pointer-events-none">
                <div className="px-3 py-1 rounded bg-white/90 backdrop-blur-xs font-mono text-xs text-[#1C2526] shadow-xs border border-[#E2E7E4]">
                  <span>Peak Session: 08:00 AM - 10:00 AM (34 check-ins/hr)</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-[#173C34] font-bold">
                    <span className="h-2 w-2 rounded-full bg-[#1F4E43]"></span>Today Velocity
                  </span>
                  <span className="flex items-center gap-1 text-[#1F4E43] font-bold">
                    <span className="h-2 w-2 rounded-full bg-[#1F4E43]"></span>Yesterday Benchmark
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex justify-between text-[#64716D] font-mono text-[11px] pt-4">
                <span>04:00</span>
                <span>08:00 (Summit Start)</span>
                <span>12:00 (Ridge Crossing)</span>
                <span>16:00 (Camp Arrival)</span>
                <span>20:00 (Debrief)</span>
                <span>23:59</span>
              </div>
            </div>

            {/* Comparative stats callouts row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-[#F7F8F6] border border-[#E2E7E4] flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#64716D]">Today Total</span>
                <span className="text-base font-bold text-[#1C2526]">142 Hikers</span>
                <span className="text-xs text-[#173C34] font-semibold">Peak: 08:00 - 10:00 AM</span>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F8F6] border border-[#E2E7E4] flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#64716D]">This Week</span>
                <span className="text-base font-bold text-[#1C2526]">1,085 Hikers</span>
                <span className="text-xs text-[#1F4E43] font-semibold">+9.2% vs previous</span>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F8F6] border border-[#E2E7E4] flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#64716D]">This Month</span>
                <span className="text-base font-bold text-[#1C2526]">4,920 Hikers</span>
                <span className="text-xs text-[#1F4E43] font-semibold">+24.1% MoM Growth</span>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F8F6] border border-[#E2E7E4] flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#64716D]">
                    Year Target (50,000)
                  </span>
                  <span className="font-mono text-xs font-bold text-[#173C34]">85.6%</span>
                </div>
                <span className="text-base font-bold text-[#1C2526]">42,800 Hikers</span>
                <div className="w-full bg-[#E2E7E4] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-[#1F4E43] h-full rounded-full" style={{ width: '85.6%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 & 5: Bento Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Top Performing Tours Table */}
            <div className="lg:col-span-8 flex flex-col gap-4 p-6 bg-white rounded-2xl shadow-sm border border-[#E2E7E4]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#1C2526]">
                  {t('adminStats.topTours')}
                  </h2>
                  <p className="text-xs text-[#64716D]">
                    {t('adminStats.topToursHelp')}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#1F4E43] font-bold px-2 py-0.5 rounded bg-[#E7F2EC]">
                  {t('adminStats.sampleRanking')}
                </span>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setRegionFilter('all')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'all'
                      ? 'bg-[#E7F2EC] text-[#00201a] shadow-xs'
                      : 'bg-[#F7F8F6] text-[#64716D] hover:text-[#1C2526]'
                  }`}
                >
                  {t('adminStats.allRegions')}
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('sapa')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'sapa'
                      ? 'bg-[#E7F2EC] text-[#00201a] shadow-xs'
                      : 'bg-[#F7F8F6] text-[#64716D] hover:text-[#1C2526]'
                  }`}
                >
                  {t('adminStats.sapa')}
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('hagiang')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'hagiang'
                      ? 'bg-[#E7F2EC] text-[#00201a] shadow-xs'
                      : 'bg-[#F7F8F6] text-[#64716D] hover:text-[#1C2526]'
                  }`}
                >
                  {t('adminStats.haGiang')}
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('dalat')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'dalat'
                      ? 'bg-[#E7F2EC] text-[#00201a] shadow-xs'
                      : 'bg-[#F7F8F6] text-[#64716D] hover:text-[#1C2526]'
                  }`}
                >
                  {t('adminStats.daLat')}
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('phongnha')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'phongnha'
                      ? 'bg-[#E7F2EC] text-[#00201a] shadow-xs'
                      : 'bg-[#F7F8F6] text-[#64716D] hover:text-[#1C2526]'
                  }`}
                >
                  {t('adminStats.phongNha')}
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[#64716D] font-mono text-[10px] uppercase tracking-wider bg-[#F7F8F6] border-y border-[#E2E7E4]">
                      <th className="py-2.5 px-3">{t('adminStats.tourAndPartner')}</th>
                      <th className="py-2.5 px-3 text-right">{t('adminStats.todayMonth')}</th>
                      <th className="py-2.5 px-3 text-right">{t('adminStats.revenue')}</th>
                      <th className="py-2.5 px-3 text-center">{t('adminStats.rating')}</th>
                      <th className="py-2.5 px-3 text-right">{t('adminStats.escrowStatus')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8ECE9]">
                    {/* Item 1 */}
                    <tr className="hover:bg-[#F7F8F6]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#1F4E43] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                            1
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#1C2526]">
                                Fansipan 3D2N Cloud Ridge &amp; Pine Forest Camp
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-[#ffdbd0] text-[#173C34] font-mono text-[9px] font-bold uppercase">
                                Trending #1
                              </span>
                            </div>
                            <span className="text-[11px] text-[#64716D]">
                              Sapa Peak Expeditions Co. •{' '}
                              <span className="text-[#1F4E43] font-semibold">Tier-1 Partner</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-[#1C2526]">48 today</div>
                        <div className="text-[10px] text-[#64716D]">1,420 month</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#1C2526]">
                        4,544,000,000 ₫
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#F7F8F6] font-mono text-xs font-semibold text-[#824500]">
                          ★ 4.96 <span className="text-[#64716D] text-[10px]">(342)</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-[#E7F2EC] text-[#00201a] font-mono text-[10px] font-bold">
                          100% Completed
                        </span>
                      </td>
                    </tr>

                    {/* Item 2 */}
                    <tr className="hover:bg-[#F7F8F6]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#EEF2EF] text-[#1C2526] flex items-center justify-center font-mono text-[10px] font-bold">
                            2
                          </span>
                          <div>
                            <span className="font-bold text-[#1C2526]">
                              Ha Giang Karst Plateau 4D3N Motor &amp; Trek Loop
                            </span>
                            <span className="block text-[11px] text-[#64716D]">
                              Northern Highland Trails Co.
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-[#1C2526]">34 today</div>
                        <div className="text-[10px] text-[#64716D]">1,110 month</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#1C2526]">
                        3,885,000,000 ₫
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#F7F8F6] font-mono text-xs font-semibold text-[#824500]">
                          ★ 4.92 <span className="text-[#64716D] text-[10px]">(280)</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-[#E7F2EC] text-[#00201a] font-mono text-[10px] font-bold">
                          99.2% Completed
                        </span>
                      </td>
                    </tr>

                    {/* Item 3 */}
                    <tr className="hover:bg-[#F7F8F6]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#EEF2EF] text-[#1C2526] flex items-center justify-center font-mono text-[10px] font-bold">
                            3
                          </span>
                          <div>
                            <span className="font-bold text-[#1C2526]">
                              Langbiang Cloud Forest 2D1N Camping Trek
                            </span>
                            <span className="block text-[11px] text-[#64716D]">
                              Da Lat Mountain Guides
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-[#1C2526]">26 today</div>
                        <div className="text-[10px] text-[#64716D]">840 month</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#1C2526]">
                        1,512,000,000 ₫
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#F7F8F6] font-mono text-xs font-semibold text-[#824500]">
                          ★ 4.88 <span className="text-[#64716D] text-[10px]">(195)</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-[#E7F2EC] text-[#00201a] font-mono text-[10px] font-bold">
                          100% Completed
                        </span>
                      </td>
                    </tr>

                    {/* Item 4 */}
                    <tr className="hover:bg-[#F7F8F6]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#EEF2EF] text-[#1C2526] flex items-center justify-center font-mono text-[10px] font-bold">
                            4
                          </span>
                          <div>
                            <span className="font-bold text-[#1C2526]">
                              Pu Luong Valley Terraced Rice Walk 2D1N
                            </span>
                            <span className="block text-[11px] text-[#64716D]">
                              Highland Trails Vietnam
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-[#1C2526]">18 today</div>
                        <div className="text-[10px] text-[#64716D]">620 month</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#1C2526]">
                        1,054,000,000 ₫
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#F7F8F6] font-mono text-xs font-semibold text-[#824500]">
                          ★ 4.85 <span className="text-[#64716D] text-[10px]">(140)</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-[#E7F2EC] text-[#00201a] font-mono text-[10px] font-bold">
                          98.5% Completed
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 4 Columns: Financial Settlement & Operations Health */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {/* Money Statistics */}
              <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#E2E7E4] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8ECE9]">
                  <h3 className="font-serif text-base font-bold text-[#1C2526]">
                    {t('adminStats.moneyStats')}
                  </h3>
                  <span className="text-xs">🏛</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E2E7E4] flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#64716D]">
                      {t('adminStats.totalEscrowHold')}
                    </span>
                    <span className="font-mono text-base font-bold text-[#1C2526]">
                      1,240,000,000 ₫
                    </span>
                    <span className="font-mono text-[10px] text-[#1F4E43]">
                      {t('adminStats.sampleBankSecurity')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E2E7E4] flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#64716D]">
                      {t('adminStats.readyForTransfer')}
                    </span>
                    <span className="font-mono text-base font-bold text-[#173C34]">
                      890,000,000 ₫
                    </span>
                    <span className="font-mono text-[10px] text-[#64716D]">
                      {t('adminStats.partnerCount', { count: 24 })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E2E7E4] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#64716D] block">
                        {t('adminStats.platformFee')}
                      </span>
                      <span className="font-mono text-sm font-bold text-[#1C2526]">
                        134,000,000 ₫
                      </span>
                    </div>
                    <span className="text-xs text-[#1F4E43] font-bold">↑ +14%</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E2E7E4] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#64716D] block">
                        {t('adminStats.refundReserve')}
                      </span>
                      <span className="font-mono text-sm font-bold text-[#1C2526]">
                        18,500,000 ₫
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#E7F2EC] text-[#00201a] font-mono text-[10px] font-bold">
                      1.4% Low
                    </span>
                  </div>
                </div>
              </div>

              {/* Operations Health Summary */}
              <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#E2E7E4] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8ECE9]">
                  <h3 className="font-serif text-base font-bold text-[#1C2526]">
                      {t('adminStats.operationsHealth')}
                  </h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1F4E43] animate-ping"></span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#64716D]">{t('adminStats.checkinRate')}</span>
                    <span className="font-mono font-bold text-[#1C2526]">99.4%</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#64716D]">{t('adminStats.guideBeacons')}</span>
                    <span className="font-mono font-bold text-[#1F4E43]">38 / 38 Online</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#64716D]">{t('adminStats.supportResponseTime')}</span>
                    <span className="font-mono font-bold text-[#1C2526]">1m 15s avg</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="p-3 rounded-lg bg-[#F7F8F6] border border-[#E2E7E4] flex items-center gap-2.5">
                    <span className="text-lg">🛡️</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1C2526]">
                        {t('adminStats.safetySummary')}
                      </span>
                      <span className="font-mono text-[10px] text-[#1F4E43]">
                        {t('adminStats.noCriticalIncidents')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C2526] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-white/20 animate-fade-in flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-[#1F4E43] text-white flex items-center justify-center text-xs font-bold">
            ✓
          </span>
          <div>
            <p className="text-xs font-bold">{toast.title}</p>
            <p className="text-[11px] text-stone-300">{toast.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPartnerManagementPage;
