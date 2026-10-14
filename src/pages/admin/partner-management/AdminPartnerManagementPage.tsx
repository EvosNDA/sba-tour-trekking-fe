import React, { useState } from 'react';
import { ScreenId } from '../../../types/expedition';

export interface AdminPartnerManagementPageProps {
  onNavigate?: (screen: ScreenId) => void;
}

export const AdminPartnerManagementPage: React.FC<AdminPartnerManagementPageProps> = ({
  onNavigate = () => {},
}) => {
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
      showToast('Live Data Refreshed', 'Synced latest check-ins across 14 alpine base stations.');
    }, 750);
  };

  const handleExport = () => {
    showToast(
      'Exporting Performance Report',
      'Compiled PDF & CSV report generated with Circular 78 e-invoices.'
    );
  };

  return (
    <div className="w-full bg-[#f2fbfc] text-[#141d1e] min-h-screen font-sans flex">
      {/* Ops Sidebar (~64 w) */}
      <aside className="hidden lg:flex w-64 bg-[#ecf5f6] border-r border-[#dbe4e5] flex-col justify-between py-6 shrink-0 z-20">
        <div className="flex flex-col gap-6">
          <div className="px-6 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#9b2f00] flex items-center justify-center text-white font-bold text-sm">
              ⛰
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#141d1e] tracking-tight leading-none">
                SummitTrails
              </span>
              <span className="font-mono text-[10px] text-[#59413a] uppercase tracking-wider mt-1">
                Ops Console
              </span>
            </div>
          </div>

          <div className="px-3">
            <span className="px-3 font-mono text-[10px] text-[#59413a] uppercase tracking-wider font-bold">
              Operational Nodes
            </span>
            <nav className="flex flex-col gap-1 mt-2">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#c2410c] text-white font-semibold text-xs text-left cursor-pointer shadow-xs"
              >
                <span>📊</span>
                <span>Dashboard &amp; Overview</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('staff_escalations')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#59413a] hover:bg-[#e0eaeb] hover:text-[#141d1e] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>💬</span>
                <span>Live Chats &amp; Escalations</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ops_moderation')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#59413a] hover:bg-[#e0eaeb] hover:text-[#141d1e] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🗺</span>
                <span>Tour Submissions</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('partner_company_info')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#59413a] hover:bg-[#e0eaeb] hover:text-[#141d1e] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🛡</span>
                <span>Partner Verifications</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#59413a] hover:bg-[#e0eaeb] hover:text-[#141d1e] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🏪</span>
                <span>Marketplace</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="px-3">
          <div className="p-2.5 rounded-xl bg-white border border-[#dbe4e5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39675b]"></span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#141d1e]">Telemetry Link</span>
                <span className="font-mono text-[9px] text-[#39675b]">NODE-VN-07 // 99.98%</span>
              </div>
            </div>
            <span className="text-[#39675b] text-xs">📡</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#dbe4e5] z-30 flex items-center justify-between px-6 sticky top-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#59413a]">
              <span>Staff Workspace</span>
              <span>›</span>
              <span className="font-bold text-[#141d1e]">Platform Statistics &amp; Performance</span>
            </div>
            <div className="h-4 w-px bg-[#dbe4e5] hidden md:block"></div>
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#bceddd] text-[#00201a]">
              <span className="w-2 h-2 rounded-full bg-[#39675b] animate-pulse"></span>
              <span className="font-mono text-[11px] font-bold">Live Feed (Updated 1m ago)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-xs text-[#59413a] px-2.5 py-1 rounded bg-[#ecf5f6] border border-[#dbe4e5]">
              <span>🌐</span>
              <span className="font-mono text-[11px]">Hanoi HQ (UTC+7)</span>
            </div>
            <div className="h-6 w-px bg-[#dbe4e5]"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#9b2f00] text-white flex items-center justify-center font-bold text-xs">
                KV
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-[#141d1e] leading-tight">K. Vance</span>
                <span className="font-mono text-[10px] text-[#59413a]">Operations Lead</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
          {/* Section 1: Page Header & Time-Range Strip */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#9b2f00] font-mono text-[11px] uppercase font-bold tracking-widest">
                <span>📈</span>
                <span>Field Telemetry &amp; Financial Ledger</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#141d1e] font-bold">
                Platform Statistics &amp; Performance Overview
              </h1>
              <p className="text-xs sm:text-sm text-[#59413a]">
                Track booking volume, climber numbers, top outdoor tours, and partner payouts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#ecf5f6] text-[#141d1e] text-xs font-bold transition-colors border border-[#dbe4e5] shadow-xs cursor-pointer"
              >
                <span>📥</span>
                <span>Export Report (CSV/PDF)</span>
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#c2410c] hover:bg-[#9b2f00] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                <span>Refresh Live Data</span>
              </button>
            </div>
          </div>

          {/* Time Filter Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-1.5 bg-[#e6f0f1] rounded-lg border border-[#dbe4e5]">
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'today'
                    ? 'bg-[#c2410c] text-white shadow-xs'
                    : 'text-[#59413a] hover:text-[#141d1e]'
                }`}
              >
                <span>Today</span>
                <span className="px-1.5 py-0.2 rounded bg-black/20 font-mono text-[10px]">
                  142 Hikers
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'week'
                    ? 'bg-[#c2410c] text-white shadow-xs'
                    : 'text-[#59413a] hover:text-[#141d1e]'
                }`}
              >
                <span>This Week</span>
                <span className="px-1.5 py-0.2 rounded bg-[#dbe4e5] text-[#141d1e] font-mono text-[10px]">
                  1,085 Hikers
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'month'
                    ? 'bg-[#c2410c] text-white shadow-xs'
                    : 'text-[#59413a] hover:text-[#141d1e]'
                }`}
              >
                <span>This Month</span>
                <span className="px-1.5 py-0.2 rounded bg-[#dbe4e5] text-[#141d1e] font-mono text-[10px]">
                  4,920 Hikers
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  timeRange === 'year'
                    ? 'bg-[#c2410c] text-white shadow-xs'
                    : 'text-[#59413a] hover:text-[#141d1e]'
                }`}
              >
                <span>This Year</span>
                <span className="px-1.5 py-0.2 rounded bg-[#dbe4e5] text-[#141d1e] font-mono text-[10px]">
                  42,800 Hikers
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-[#141d1e] text-xs font-semibold shadow-xs border border-[#dbe4e5]">
              <span>📅</span>
              <span className="font-mono text-xs">Nov 1 - Nov 18, 2026</span>
            </div>
          </div>

          {/* Section 2: 4 Primary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="p-5 bg-white rounded-xl shadow-xs border border-[#dbe4e5] flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[#59413a]">
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
                    Total Customer Hikers
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#ecf5f6] text-[#39675b] text-xs font-bold">
                    🥾
                  </span>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-serif text-3xl font-bold text-[#141d1e]">142</span>
                  <span className="text-xs text-[#59413a]">Today</span>
                  <span className="ml-auto inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
                    ↑ +18.4%
                  </span>
                </div>
              </div>
              <div className="pt-4 space-y-1.5">
                <div className="h-6 flex items-end gap-1 px-1 py-0.5 bg-[#ecf5f6] rounded border border-[#dbe4e5]">
                  <div className="w-1/6 bg-[#a0d0c2] rounded-t h-2"></div>
                  <div className="w-1/6 bg-[#a0d0c2] rounded-t h-3"></div>
                  <div className="w-1/6 bg-[#b9eadb] rounded-t h-4"></div>
                  <div className="w-1/6 bg-[#39675b] rounded-t h-5"></div>
                  <div className="w-1/6 bg-[#c2410c] rounded-t h-full"></div>
                  <div className="w-1/6 bg-[#a0d0c2] rounded-t h-3"></div>
                </div>
                <div className="flex justify-between items-center text-[#59413a] font-mono text-[10px]">
                  <span>W: 1,085</span>
                  <span>M: 4,920</span>
                  <span>Y: 42.8k</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-5 bg-white rounded-xl shadow-xs border border-[#dbe4e5] flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[#59413a]">
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
                    Gross Booking Money (GMV)
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#ecf5f6] text-[#9b2f00] text-xs font-bold">
                    💳
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="font-mono text-xl font-bold text-[#141d1e]">
                    454,400,000 ₫
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#59413a]">≈ $18,170 USD today</span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
                    ↑ +12.6%
                  </span>
                </div>
              </div>
              <div className="pt-3 bg-[#ecf5f6] p-2 rounded-lg border border-[#dbe4e5] space-y-1">
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-[#59413a]">Month to Date</span>
                  <span className="text-[#141d1e] font-bold">15.74B ₫</span>
                </div>
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-[#59413a]">Annual Total</span>
                  <span className="text-[#141d1e] font-bold">136.9B ₫</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-5 bg-white rounded-xl shadow-xs border border-[#dbe4e5] flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[#59413a]">
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
                    Platform Commission (10%)
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#ecf5f6] text-[#824500] text-xs font-bold">
                    🏦
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="font-mono text-xl font-bold text-[#9b2f00]">
                    45,440,000 ₫
                  </span>
                </div>
                <p className="text-[11px] text-[#59413a] leading-tight">
                  Net platform revenue after 72-hour safety escrow release.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1.5 text-[#39675b] font-mono text-[11px] font-bold">
                <span>✓</span>
                <span>All taxes &amp; e-invoices reconciled</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-5 bg-white rounded-xl shadow-xs border border-[#dbe4e5] flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[#59413a]">
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
                    Active Expeditions &amp; Escrow
                  </span>
                  <span className="p-1.5 rounded-lg bg-[#ecf5f6] text-[#39675b] text-xs font-bold">
                    🔒
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="font-serif text-2xl font-bold text-[#141d1e]">38 Active</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#59413a]">Vault Locked:</span>
                  <span className="font-mono font-bold text-[#c2410c]">1.24B ₫</span>
                </div>
              </div>
              <div className="pt-3 flex items-center justify-between p-2 rounded bg-[#ecf5f6] border border-[#dbe4e5]">
                <span className="text-xs font-bold text-[#59413a]">Alert Status</span>
                <span className="inline-flex items-center gap-1 text-xs text-[#39675b] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#39675b]"></span> 0 Open Distress
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Growth Chart */}
          <div className="p-6 bg-white rounded-xl shadow-xs border border-[#dbe4e5] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#e6f0f1]">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#141d1e]">
                  Customer Growth &amp; Revenue Trends
                </h2>
                <p className="text-xs text-[#59413a]">
                  Real-time expedition check-ins vs platform turnover trajectory
                </p>
              </div>

              {/* Chart Tabs */}
              <div className="flex items-center gap-1 bg-[#ecf5f6] p-1 rounded-lg border border-[#dbe4e5]">
                <button
                  type="button"
                  onClick={() => setChartPeriod('daily')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    chartPeriod === 'daily'
                      ? 'bg-white text-[#141d1e] shadow-xs'
                      : 'text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Daily (Today)
                </button>
                <button
                  type="button"
                  onClick={() => setChartPeriod('weekly')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    chartPeriod === 'weekly'
                      ? 'bg-white text-[#141d1e] shadow-xs'
                      : 'text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setChartPeriod('monthly')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    chartPeriod === 'monthly'
                      ? 'bg-white text-[#141d1e] shadow-xs'
                      : 'text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setChartPeriod('annual')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    chartPeriod === 'annual'
                      ? 'bg-white text-[#141d1e] shadow-xs'
                      : 'text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Annual Year
                </button>
              </div>
            </div>

            {/* SVG Data Visualization */}
            <div className="relative w-full h-64 bg-[#ecf5f6] rounded-xl p-4 flex flex-col justify-between overflow-hidden border border-[#dbe4e5]">
              <svg className="absolute inset-0 w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 240">
                <defs>
                  <linearGradient id="primaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#c2410c" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#c2410c" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="secondaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#39675b" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#39675b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                <line x1="0" y1="40" x2="1000" y2="40" stroke="#dbe4e5" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="100" x2="1000" y2="100" stroke="#dbe4e5" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="160" x2="1000" y2="160" stroke="#dbe4e5" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="210" x2="1000" y2="210" stroke="#dbe4e5" strokeWidth="1" />

                {/* Secondary Line (Benchmark) */}
                <path
                  d="M0,190 Q120,175 250,150 T500,140 T750,110 T1000,95 L1000,240 L0,240 Z"
                  fill="url(#secondaryAreaGrad)"
                />
                <path
                  d="M0,190 Q120,175 250,150 T500,140 T750,110 T1000,95"
                  stroke="#39675b"
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
                  stroke="#c2410c"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />

                {/* Data Waypoint Circles */}
                <circle cx="520" cy="70" r="5" fill="#c2410c" />
                <circle cx="520" cy="70" r="10" stroke="#c2410c" strokeWidth="1.5" opacity="0.4" />
                <circle cx="880" cy="50" r="5" fill="#c2410c" />
              </svg>

              {/* Floating HUD Overlays */}
              <div className="relative z-10 flex justify-between items-start pointer-events-none">
                <div className="px-3 py-1 rounded bg-white/90 backdrop-blur-xs font-mono text-xs text-[#141d1e] shadow-xs border border-[#dbe4e5]">
                  <span>Peak Session: 08:00 AM - 10:00 AM (34 check-ins/hr)</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-[#9b2f00] font-bold">
                    <span className="h-2 w-2 rounded-full bg-[#c2410c]"></span>Today Velocity
                  </span>
                  <span className="flex items-center gap-1 text-[#39675b] font-bold">
                    <span className="h-2 w-2 rounded-full bg-[#39675b]"></span>Yesterday Benchmark
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex justify-between text-[#59413a] font-mono text-[11px] pt-4">
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
              <div className="p-3 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#59413a]">Today Total</span>
                <span className="text-base font-bold text-[#141d1e]">142 Hikers</span>
                <span className="text-xs text-[#9b2f00] font-semibold">Peak: 08:00 - 10:00 AM</span>
              </div>
              <div className="p-3 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#59413a]">This Week</span>
                <span className="text-base font-bold text-[#141d1e]">1,085 Hikers</span>
                <span className="text-xs text-[#39675b] font-semibold">+9.2% vs previous</span>
              </div>
              <div className="p-3 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#59413a]">This Month</span>
                <span className="text-base font-bold text-[#141d1e]">4,920 Hikers</span>
                <span className="text-xs text-[#39675b] font-semibold">+24.1% MoM Growth</span>
              </div>
              <div className="p-3 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#59413a]">
                    Year Target (50,000)
                  </span>
                  <span className="font-mono text-xs font-bold text-[#9b2f00]">85.6%</span>
                </div>
                <span className="text-base font-bold text-[#141d1e]">42,800 Hikers</span>
                <div className="w-full bg-[#dbe4e5] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-[#c2410c] h-full rounded-full" style={{ width: '85.6%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 & 5: Bento Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Top Performing Tours Table */}
            <div className="lg:col-span-8 flex flex-col gap-4 p-6 bg-white rounded-xl shadow-xs border border-[#dbe4e5]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#141d1e]">
                    Top Performing Tours by Bookings &amp; Revenue
                  </h2>
                  <p className="text-xs text-[#59413a]">
                    Ranked by ticket sales, customer reviews, and partner completion rate
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[#39675b] font-bold px-2 py-0.5 rounded bg-[#b9eadb]">
                  Live Auto-Sorted
                </span>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setRegionFilter('all')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'all'
                      ? 'bg-[#bceddd] text-[#00201a] shadow-xs'
                      : 'bg-[#ecf5f6] text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  All Regions
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('sapa')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'sapa'
                      ? 'bg-[#bceddd] text-[#00201a] shadow-xs'
                      : 'bg-[#ecf5f6] text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Sapa / Fansipan
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('hagiang')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'hagiang'
                      ? 'bg-[#bceddd] text-[#00201a] shadow-xs'
                      : 'bg-[#ecf5f6] text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Ha Giang
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('dalat')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'dalat'
                      ? 'bg-[#bceddd] text-[#00201a] shadow-xs'
                      : 'bg-[#ecf5f6] text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Da Lat
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('phongnha')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    regionFilter === 'phongnha'
                      ? 'bg-[#bceddd] text-[#00201a] shadow-xs'
                      : 'bg-[#ecf5f6] text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Phong Nha
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[#59413a] font-mono text-[10px] uppercase tracking-wider bg-[#ecf5f6] border-y border-[#dbe4e5]">
                      <th className="py-2.5 px-3">Tour &amp; Partner</th>
                      <th className="py-2.5 px-3 text-right">Today / Month</th>
                      <th className="py-2.5 px-3 text-right">Revenue</th>
                      <th className="py-2.5 px-3 text-center">Rating</th>
                      <th className="py-2.5 px-3 text-right">Escrow Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6f0f1]">
                    {/* Item 1 */}
                    <tr className="hover:bg-[#ecf5f6]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#c2410c] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                            1
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#141d1e]">
                                Fansipan 3D2N Cloud Ridge &amp; Pine Forest Camp
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-[#ffdbd0] text-[#9b2f00] font-mono text-[9px] font-bold uppercase">
                                Trending #1
                              </span>
                            </div>
                            <span className="text-[11px] text-[#59413a]">
                              Sapa Peak Expeditions Co. •{' '}
                              <span className="text-[#39675b] font-semibold">Tier-1 Partner</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-[#141d1e]">48 today</div>
                        <div className="text-[10px] text-[#59413a]">1,420 month</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#141d1e]">
                        4,544,000,000 ₫
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#ecf5f6] font-mono text-xs font-semibold text-[#824500]">
                          ★ 4.96 <span className="text-[#59413a] text-[10px]">(342)</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
                          100% Completed
                        </span>
                      </td>
                    </tr>

                    {/* Item 2 */}
                    <tr className="hover:bg-[#ecf5f6]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#e0eaeb] text-[#141d1e] flex items-center justify-center font-mono text-[10px] font-bold">
                            2
                          </span>
                          <div>
                            <span className="font-bold text-[#141d1e]">
                              Ha Giang Karst Plateau 4D3N Motor &amp; Trek Loop
                            </span>
                            <span className="block text-[11px] text-[#59413a]">
                              Northern Highland Trails Co.
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-[#141d1e]">34 today</div>
                        <div className="text-[10px] text-[#59413a]">1,110 month</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#141d1e]">
                        3,885,000,000 ₫
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#ecf5f6] font-mono text-xs font-semibold text-[#824500]">
                          ★ 4.92 <span className="text-[#59413a] text-[10px]">(280)</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
                          99.2% Completed
                        </span>
                      </td>
                    </tr>

                    {/* Item 3 */}
                    <tr className="hover:bg-[#ecf5f6]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#e0eaeb] text-[#141d1e] flex items-center justify-center font-mono text-[10px] font-bold">
                            3
                          </span>
                          <div>
                            <span className="font-bold text-[#141d1e]">
                              Langbiang Cloud Forest 2D1N Camping Trek
                            </span>
                            <span className="block text-[11px] text-[#59413a]">
                              Da Lat Mountain Guides
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-[#141d1e]">26 today</div>
                        <div className="text-[10px] text-[#59413a]">840 month</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#141d1e]">
                        1,512,000,000 ₫
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#ecf5f6] font-mono text-xs font-semibold text-[#824500]">
                          ★ 4.88 <span className="text-[#59413a] text-[10px]">(195)</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
                          100% Completed
                        </span>
                      </td>
                    </tr>

                    {/* Item 4 */}
                    <tr className="hover:bg-[#ecf5f6]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#e0eaeb] text-[#141d1e] flex items-center justify-center font-mono text-[10px] font-bold">
                            4
                          </span>
                          <div>
                            <span className="font-bold text-[#141d1e]">
                              Pu Luong Valley Terraced Rice Walk 2D1N
                            </span>
                            <span className="block text-[11px] text-[#59413a]">
                              Highland Trails Vietnam
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-[#141d1e]">18 today</div>
                        <div className="text-[10px] text-[#59413a]">620 month</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#141d1e]">
                        1,054,000,000 ₫
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#ecf5f6] font-mono text-xs font-semibold text-[#824500]">
                          ★ 4.85 <span className="text-[#59413a] text-[10px]">(140)</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
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
              <div className="p-5 bg-white rounded-xl shadow-xs border border-[#dbe4e5] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e6f0f1]">
                  <h3 className="font-serif text-base font-bold text-[#141d1e]">
                    Money Statistics
                  </h3>
                  <span className="text-xs">🏛</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#59413a]">
                      Total Escrow in 72-Hour Hold
                    </span>
                    <span className="font-mono text-base font-bold text-[#141d1e]">
                      1,240,000,000 ₫
                    </span>
                    <span className="font-mono text-[10px] text-[#39675b]">
                      Secured by National Bank Node
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#59413a]">
                      Ready for Monday Wire Transfer
                    </span>
                    <span className="font-mono text-base font-bold text-[#9b2f00]">
                      890,000,000 ₫
                    </span>
                    <span className="font-mono text-[10px] text-[#59413a]">
                      To 24 Verified Local Partners
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#59413a] block">
                        Platform Fee (10%)
                      </span>
                      <span className="font-mono text-sm font-bold text-[#141d1e]">
                        134,000,000 ₫
                      </span>
                    </div>
                    <span className="text-xs text-[#39675b] font-bold">↑ +14%</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#59413a] block">
                        Refund Reserve Pool
                      </span>
                      <span className="font-mono text-sm font-bold text-[#141d1e]">
                        18,500,000 ₫
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
                      1.4% Low
                    </span>
                  </div>
                </div>
              </div>

              {/* Operations Health Summary */}
              <div className="p-5 bg-white rounded-xl shadow-xs border border-[#dbe4e5] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e6f0f1]">
                  <h3 className="font-serif text-base font-bold text-[#141d1e]">
                    Operations Health
                  </h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#39675b] animate-ping"></span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#59413a]">Check-in completion rate</span>
                    <span className="font-mono font-bold text-[#141d1e]">99.4%</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#59413a]">Guide satellite beacons</span>
                    <span className="font-mono font-bold text-[#39675b]">38 / 38 Online</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#59413a]">Support response time</span>
                    <span className="font-mono font-bold text-[#141d1e]">1m 15s avg</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="p-3 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex items-center gap-2.5">
                    <span className="text-lg">🛡️</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#141d1e]">
                        Mountain Safety Ledger
                      </span>
                      <span className="font-mono text-[10px] text-[#39675b]">
                        Zero critical accidents in 48 hours
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#141d1e] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-white/20 animate-fade-in flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-[#39675b] text-white flex items-center justify-center text-xs font-bold">
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
