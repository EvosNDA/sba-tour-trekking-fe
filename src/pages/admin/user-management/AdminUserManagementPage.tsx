import React, { useState } from 'react';
import { ScreenId } from '../../../types/expedition';
import { useI18n } from '../../../i18n/I18nProvider';

export interface AdminUserManagementPageProps {
  onNavigate?: (screen: ScreenId) => void;
}

interface ChatMessage {
  id: string;
  sender: 'customer' | 'staff' | 'system';
  text: string;
  time: string;
  senderName: string;
  isInternalNote?: boolean;
}

interface EscalationCustomer {
  id: string;
  name: string;
  initials: string;
  priority: 'HIGH' | 'MED' | 'LOW';
  tourName: string;
  guests: string;
  typeBadge: string;
  summary: string;
  ref: string;
  waitStatus: string;
  isOnline: boolean;
}

const CUSTOMERS: EscalationCustomer[] = [
  {
    id: 'eleanor-vance',
    name: 'Eleanor Vance',
    initials: 'EV',
    priority: 'HIGH',
    tourName: 'Fansipan 3D2N Trek • 2 Guests',
    guests: 'Trip Leader • 2 Guests',
    typeBadge: 'Requested Human',
    summary: 'Weather radar & reschedule query',
    ref: '#TRK-98421',
    waitStatus: 'In Chat With You',
    isOnline: true,
  },
  {
    id: 'marcus-thorne',
    name: 'Marcus Thorne',
    initials: 'MT',
    priority: 'MED',
    tourName: 'Ha Giang Loop 4D3N • Solo',
    guests: 'Solo Adventurer',
    typeBadge: 'AI Payment Proof',
    summary: 'Bank transfer slip upload failed twice',
    ref: '#TRK-98422',
    waitStatus: 'Wait: 3m',
    isOnline: false,
  },
  {
    id: 'linh-tran',
    name: 'Linh Tran',
    initials: 'LT',
    priority: 'LOW',
    tourName: 'Pu Luong Valley Walk • 4 Guests',
    guests: 'Family Group • 4 Guests',
    typeBadge: 'Requested Human',
    summary: 'Luggage porter weight & gear size',
    ref: '#TRK-98390',
    waitStatus: 'Wait: 5m',
    isOnline: false,
  },
];

export const AdminUserManagementPage: React.FC<AdminUserManagementPageProps> = ({
  onNavigate = () => {},
}) => {
  const { t } = useI18n();
  const [selectedCustomerId, setSelectedCustomerId] = useState('eleanor-vance');
  const [queueTab, setQueueTab] = useState<'waiting' | 'active' | 'done'>('waiting');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoAccept, setAutoAccept] = useState(true);
  const [showAiTranscript, setShowAiTranscript] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [rescheduled, setRescheduled] = useState(false);

  // Message stream
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'customer',
      senderName: 'Eleanor Vance',
      text: 'Hello, I saw heavy rain is forecast on our summit morning (Nov 13). Can I move our trek by 1 day or do we still hike in the rain? We have our sleeping bags ready.',
      time: '10:42 AM',
    },
    {
      id: 'm2',
      sender: 'staff',
      senderName: 'K. Vance (You)',
      text: "Hi Eleanor! I'm Vance from SummitTrails dispatch. I can help you with this right now! Let me look at the official mountain weather radar and open dates with Sapa Peak Expeditions.",
      time: '10:43 AM',
    },
    {
      id: 'm3',
      sender: 'customer',
      senderName: 'Eleanor Vance',
      text: 'Thank you so much Vance! We really want to see the sunrise above the clouds if possible. We have extra nights booked in Sapa Town so +1 day is very easy for us.',
      time: '10:44 AM',
    },
  ]);

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
    }, 4500);
  };

  const handleSendMessage = () => {
    if (!replyInput.trim()) return;

    showToast(t('adminSupport.notConnectedTitle'), t('adminSupport.replyNotSent'));
  };

  const handleShortcutClick = (text: string) => {
    setReplyInput(text);
  };

  const handleRescheduleOneClick = () => {
    showToast(t('adminSupport.notConnectedTitle'), t('adminSupport.rescheduleNotConnected'));
  };

  const handleResolve = () => {
    showToast(t('adminSupport.notConnectedTitle'), t('adminSupport.resolveNotConnected'));
  };

  const selectedCustomer =
    CUSTOMERS.find((c) => c.id === selectedCustomerId) || CUSTOMERS[0];
  const filteredCustomers = CUSTOMERS.filter(
    (c) =>
      searchTerm === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ref.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-[#F7F8F6] text-[#1C2526] min-h-screen font-sans flex">
      {/* Ops Sidebar (~72 w) */}
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
                {t('adminNav.supportDesk')}
              </span>
            </div>
          </div>

          <div className="px-3">
            <span className="px-3 font-mono text-[10px] text-[#64716D] uppercase tracking-wider font-bold">
              {t('adminNav.staffWorkspaces')}
            </span>
            <nav className="flex flex-col gap-1 mt-2">
              <button
                type="button"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1F4E43] text-white font-semibold text-xs text-left cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span>💬</span>
                  <span>{t('adminNav.liveChats')}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
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
                onClick={() => onNavigate('platform_analytics')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#64716D] hover:bg-[#EEF2EF] hover:text-[#1C2526] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>📊</span>
                <span>{t('adminNav.analytics')}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('partner_company_info')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#64716D] hover:bg-[#EEF2EF] hover:text-[#1C2526] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🛡</span>
                <span>{t('adminNav.partnerReview')}</span>
              </button>

              <div className="flex items-center justify-between px-3 py-2 rounded-xl text-[#64716D] text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span>🚨</span>
                  <span>{t('adminNav.incidents')}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] font-mono text-[10px] font-bold">
              {t('adminNav.highCount', { count: 0 })}
                </span>
              </div>
            </nav>
          </div>

          <div className="px-3">
            <span className="px-3 font-mono text-[10px] text-[#64716D] uppercase tracking-wider font-bold">
              {t('adminNav.quickLinks')}
            </span>
            <nav className="flex flex-col gap-1 mt-2">
              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#64716D] hover:bg-[#EEF2EF] hover:text-[#1C2526] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🏪</span>
                <span>{t('adminNav.marketplace')}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('eticket')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#64716D] hover:bg-[#EEF2EF] hover:text-[#1C2526] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🎟</span>
                <span>{t('adminNav.tickets')}</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="px-3">
          <div className="p-2.5 rounded-xl bg-white border border-[#E2E7E4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1F4E43]"></span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#1C2526]">{t('adminNav.sampleNode')}</span>
                <span className="font-mono text-[9px] text-[#64716D]">46.5402° N, 7.9836° E</span>
              </div>
            </div>
            <span className="text-[#1F4E43] text-xs">☁</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E7E4] z-30 flex items-center justify-between px-6 sticky top-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1C2526] tracking-tight">
                {t('adminNav.brandSupport')}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg bg-[#EEF2EF] text-[#1C2526] font-mono">
                {t('adminNav.sampleMode')}
              </span>
            </div>
            <div className="h-4 w-px bg-[#E2E7E4] hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#E7F2EC]">
              <span className="w-2 h-2 rounded-full bg-[#1F4E43]"></span>
              <span className="text-[11px] font-bold text-[#3d6b5f]">{t('adminNav.sampleStatus')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#64716D] hover:bg-[#F7F8F6] hover:text-[#1C2526] transition-colors cursor-pointer"
              >
                🔔
              </button>
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#173C34] text-white font-mono text-[10px] flex items-center justify-center font-bold">
                3
              </span>
            </div>
            <div className="h-6 w-px bg-[#E2E7E4]"></div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-[#1C2526] leading-tight">K. Vance</span>
                <span className="font-mono text-[10px] text-[#64716D]">{t('adminNav.supportSpecialist')}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#173C34] text-white flex items-center justify-center font-bold text-xs">
                KV
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-4 sm:p-6 xl:p-8">
          <p role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('adminSupport.sampleDataNote')}</p>
          {/* Desk Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white shadow-sm border border-[#E2E7E4]">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1F4E43] animate-pulse"></span>
                  <span className="text-[11px] font-bold text-[#1F4E43] uppercase tracking-wider font-mono">
                    {t('adminSupport.eyebrow')}
                  </span>
                </div>
                <h1 className="font-serif text-2xl text-[#1C2526] tracking-tight mt-0.5 font-bold">
                  {t('adminSupport.title')}
                </h1>
              </div>
              <div className="hidden md:block h-10 w-px bg-[#E2E7E4]"></div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ffdbd0] text-[#390c00] text-xs font-bold">
                  <span>🚨</span>
                  <span>{t('adminSupport.inQueue', { count: 3 })}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EEF2EF] text-[#1C2526] text-xs font-medium">
                  <span>⏱</span>
                  <span>{t('adminSupport.avgWait')}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E7F2EC] text-[#3d6b5f] text-xs font-bold">
                  <span>✓</span>
                  <span>{t('adminSupport.solvedRate')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end lg:self-auto">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#E8ECE9] border border-[#E2E7E4]">
                <span className="text-xs text-[#1C2526] font-semibold">{t('adminSupport.autoAccept')}</span>
                <button
                  type="button"
                  aria-pressed={autoAccept}
                  aria-label={t('adminSupport.autoAccept')}
                  onClick={() => setAutoAccept(!autoAccept)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-200 cursor-pointer ${
                    autoAccept ? 'bg-[#1F4E43]' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ${
                      autoAccept ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F8F6] text-[#64716D] font-mono text-xs border border-[#E2E7E4]">
                <span className="text-[#173C34]">📡</span>
                <span>GATEWAY-SAP-02</span>
              </div>
            </div>
          </div>

          {/* 3-Column Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* COLUMN 1: Queue List (~3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-3.5">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E2E7E4] shadow-xs flex flex-col gap-3">
                <div className="relative w-full">
                  <input
                    className="w-full pl-8 pr-3 py-2 bg-[#F7F8F6] text-[#1C2526] placeholder:text-[#64716D] rounded-xl text-xs border border-[#E2E7E4] focus:outline-none focus:bg-white focus:border-[#1F4E43]"
                    placeholder={t('adminSupport.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    type="text"
                  />
                  <span className="absolute left-2.5 top-2 text-xs">🔍</span>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setQueueTab('waiting')}
                    className={`flex-1 py-1.5 rounded-lg text-xs text-center font-bold transition-all cursor-pointer ${
                      queueTab === 'waiting'
                        ? 'bg-[#173C34] text-white shadow-xs'
                        : 'bg-[#E8ECE9] text-[#64716D] hover:text-[#1C2526]'
                    }`}
                  >
                    {t('adminSupport.waitingCount', { count: 3 })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueTab('active')}
                    className={`flex-1 py-1.5 rounded-lg text-xs text-center font-medium transition-all cursor-pointer ${
                      queueTab === 'active'
                        ? 'bg-[#173C34] text-white shadow-xs'
                        : 'bg-[#E8ECE9] text-[#64716D] hover:text-[#1C2526]'
                    }`}
                  >
                    {t('adminSupport.activeCount', { count: 2 })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueTab('done')}
                    className={`flex-1 py-1.5 rounded-lg text-xs text-center font-medium transition-all cursor-pointer ${
                      queueTab === 'done'
                        ? 'bg-[#173C34] text-white shadow-xs'
                        : 'bg-[#E8ECE9] text-[#64716D] hover:text-[#1C2526]'
                    }`}
                  >
                    {t('adminSupport.doneCount', { count: 19 })}
                  </button>
                </div>
              </div>

              {/* Queue Cards */}
              <div className="flex flex-col gap-2.5">
                {!filteredCustomers.length && <p className="rounded-xl border border-dashed border-[#CAD4CF] bg-white px-4 py-8 text-center text-sm text-[#64716D]">{t('adminSupport.noMatches')}</p>}
                {filteredCustomers.map((cust) => {
                  const isSelected = cust.id === selectedCustomerId;
                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-2 border-[#1F4E43] shadow-md ring-2 ring-[#1F4E43]/20'
                          : 'bg-white border border-[#E2E7E4] shadow-xs hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              cust.isOnline ? 'bg-[#1F4E43]' : 'bg-[#824500]'
                            }`}
                          ></span>
                          <span className="text-sm text-[#1C2526] font-bold">{cust.name}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            cust.priority === 'HIGH'
                              ? 'bg-[#ffdad6] text-[#ba1a1a]'
                              : 'bg-[#E8ECE9] text-[#64716D]'
                          }`}
                        >
                          {cust.priority}
                        </span>
                      </div>
                      <p className="text-xs text-[#64716D] mt-1 font-medium">{cust.tourName}</p>

                      <div className="mt-2.5 p-2 rounded-xl bg-[#F7F8F6] flex flex-col gap-0.5 border border-[#E2E7E4]">
                        <div className="flex items-center gap-1.5 text-[#173C34]">
                          <span>🎧</span>
                          <span className="text-[11px] font-bold">{cust.typeBadge}</span>
                        </div>
                        <p className="text-xs text-[#1C2526] truncate">{cust.summary}</p>
                      </div>

                      <div className="mt-2.5 pt-2 flex items-center justify-between text-[#64716D] font-mono text-[11px] border-t border-[#E2E7E4]">
                        <span>{cust.ref}</span>
                        {isSelected ? (
                            <span className="text-[#1F4E43] font-bold">{t('adminSupport.inChat')}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomerId(cust.id);
                              showToast(t('adminSupport.pickedUp'), t('adminSupport.assignedToQueue', { name: cust.name }));
                            }}
                            className="px-2.5 py-0.5 rounded-lg bg-[#EEF2EF] hover:bg-[#1F4E43] hover:text-white transition-colors text-[10px] font-bold cursor-pointer"
                          >
                            {t('adminSupport.pickUp')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Agent Status */}
              <div className="p-3 rounded-2xl bg-[#F7F8F6] border border-[#E2E7E4] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E7F2EC] text-[#3d6b5f] flex items-center justify-center font-bold text-xs">
                    KV
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#1C2526] font-bold">{t('adminSupport.sampleAgent')}</span>
                    <span className="font-mono text-[10px] text-[#1F4E43]">
                      {t('adminSupport.acceptingChats')}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#E7F2EC] text-[#3d6b5f] font-mono text-[10px] font-bold">
                  {t('adminSupport.activeCount', { count: 2 })}
                </span>
              </div>
            </div>

            {/* COLUMN 2: LIVE CHAT CONVERSATION (5 cols) */}
            <div className="lg:col-span-5 flex flex-col rounded-2xl bg-white border border-[#E2E7E4] shadow-sm overflow-hidden">
              {/* Chat Top Banner */}
              <div className="p-4 bg-[#F7F8F6] border-b border-[#E2E7E4] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#ffdbd0] text-[#390c00] flex items-center justify-center font-bold text-sm">
                        {selectedCustomer.initials}
                      </div>
                      <span className="w-3 h-3 rounded-full bg-[#1F4E43] absolute bottom-0 right-0 ring-2 ring-white"></span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1C2526]">
                          {selectedCustomer.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#E2E7E4] text-[#64716D] text-[10px] font-bold font-mono">
                          {selectedCustomer.guests}
                        </span>
                      </div>
                      <span className="text-xs text-[#64716D]">
                        Fansipan Cloud Ridge • Nov 12 - 14 {rescheduled && '(Rescheduled to Nov 13–15)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => showToast(t('adminSupport.notConnectedTitle'), t('adminSupport.transferNotConnected'))}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-[#E8ECE9] text-[#64716D] flex items-center justify-center transition-colors border border-[#E2E7E4] cursor-pointer"
                      title={t('adminSupport.transfer')}
                    >
                      ↪
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast(t('adminSupport.notConnectedTitle'), t('adminSupport.guideInviteNotConnected'))}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#E8ECE9] text-[#1C2526] text-xs font-semibold flex items-center gap-1 transition-colors border border-[#E2E7E4] cursor-pointer"
                    >
                      <span>👤</span>
                      <span>{t('adminSupport.sampleGuide')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResolve}
                      className="px-3 py-1.5 rounded-xl bg-[#E7F2EC] hover:bg-[#a0d0c2] text-[#3d6b5f] text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>✓</span>
                      <span>{t('adminSupport.resolve')}</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#64716D] pt-1 border-t border-[#E2E7E4]">
                  <div className="flex items-center gap-1 text-[#1F4E43] font-semibold">
                    <span>⚡</span>
                    <span>{t('adminSupport.sampleTyping')}</span>
                  </div>
                  <span>Session: #SES-44910</span>
                </div>
              </div>

              {/* AI CONCIERGE HANDOFF SUMMARY CARD */}
              <div className="mx-4 mt-4 p-3.5 bg-[#E7F2EC]/30 rounded-xl border border-[#1F4E43]/30 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#00201a]">
                    <span>🤖</span>
                    <span className="text-xs font-bold">{t('adminSupport.sampleSummaryTitle')}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#64716D]">{t('adminSupport.sampleTimeAgo')}</span>
                </div>
                <p className="text-xs text-[#1C2526] leading-snug">
                  Customer asked AI Bot about the <strong>heavy rain forecast on Nov 13</strong>. Customer requested to move trek dates forward by 1 day at zero fee to guarantee sunrise views.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAiTranscript(!showAiTranscript)}
                  className="self-start mt-0.5 flex items-center gap-1 text-[#173C34] hover:underline text-xs font-bold cursor-pointer"
                >
                  <span>{t(showAiTranscript ? 'adminSupport.hideTranscript' : 'adminSupport.showTranscript')}</span>
                </button>
                {showAiTranscript && (
                  <div className="mt-1.5 p-2.5 rounded-lg bg-white text-xs flex flex-col gap-1.5 border border-[#E2E7E4]">
                    <div className="text-[#64716D] text-[11px]">
                      <strong className="text-[#1C2526]">10:39 AM [Customer]:</strong> Is it safe to summit Fansipan with Nov 13 rain forecast?
                    </div>
                    <div className="text-[#64716D] text-[11px]">
                      <strong className="text-[#1F4E43]">10:40 AM [AI]:</strong> Treks run in moderate rain. We provide ponchos and waterproof pack liners. Severe weather triggers summit closure.
                    </div>
                    <div className="text-[#64716D] text-[11px]">
                      <strong className="text-[#1C2526]">10:41 AM [Customer]:</strong> We want sunrise photos. Can we move to Nov 14?
                    </div>
                    <div className="text-[#64716D] text-[11px]">
                      <strong className="text-[#1F4E43]">10:41 AM [AI]:</strong> Rescheduling requires staff confirmation. Connecting you to Sapa dispatch now.
                    </div>
                  </div>
                )}
              </div>

              {/* Message Stream */}
              <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4 min-h-[300px] max-h-[440px]">
                <div className="flex items-center gap-2 justify-center my-1">
                  <div className="h-px flex-1 bg-[#E2E7E4]"></div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F7F8F6] text-[#64716D] font-mono text-[10px]">
                    {t('adminSupport.sampleHandoff')}
                  </span>
                  <div className="h-px flex-1 bg-[#E2E7E4]"></div>
                </div>

                {messages.map((msg) => {
                  if (msg.sender === 'system') {
                    return (
                      <div
                        key={msg.id}
                        className="p-3 bg-[#ffdbd0] text-[#390c00] rounded-xl text-xs font-mono border border-[#ffb59d]"
                      >
                        <span className="font-bold block mb-1">📢 {msg.senderName}</span>
                        {msg.text}
                      </div>
                    );
                  }

                  if (msg.sender === 'staff') {
                    return (
                      <div
                        key={msg.id}
                        className="flex items-start gap-2.5 max-w-[85%] self-end flex-row-reverse"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#173C34] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          KV
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <div className="p-3 rounded-2xl rounded-tr-none bg-[#173C34] text-white text-xs sm:text-sm shadow-xs leading-relaxed">
                            {msg.text}
                          </div>
                          <span className="font-mono text-[#64716D] text-[10px] pr-1">
                            {msg.time} • {t('adminSupport.sentByYou')}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex items-start gap-2.5 max-w-[85%]">
                      <div className="w-7 h-7 rounded-full bg-[#ffdbd0] text-[#390c00] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {selectedCustomer.initials}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="p-3 rounded-2xl rounded-tl-none bg-[#F7F8F6] text-[#1C2526] text-xs sm:text-sm shadow-xs border border-[#E2E7E4] leading-relaxed">
                          {msg.text}
                        </div>
                        <span className="font-mono text-[#64716D] text-[10px] pl-1">
                          {msg.time} • {t('adminSupport.delivered')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Composer */}
              <div className="p-3.5 bg-[#F7F8F6] border-t border-[#E2E7E4] flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <span className="font-mono text-[10px] text-[#64716D] whitespace-nowrap font-bold">
                    {t('adminSupport.shortcuts')}:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleShortcutClick(
                        'I looked at the mountain radar and can confirm we have guide capacity to move your summit departure to Nov 14 at zero extra fee!'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-[#1C2526] text-[11px] font-semibold whitespace-nowrap shadow-xs border border-[#E2E7E4] cursor-pointer"
                  >
                    + {t('adminSupport.weatherShortcut')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleShortcutClick(
                        'Your expedition has been moved forward +1 day. New departure date: Nov 13 at 06:30 Tram Ton gate.'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-[#1C2526] text-[11px] font-semibold whitespace-nowrap shadow-xs border border-[#E2E7E4] cursor-pointer"
                  >
                    + {t('adminSupport.confirmDayShortcut')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleShortcutClick(
                        'Lead Guide Giang A Pao is on frequency VHF 147.425 and has confirmed trail conditions are clear.'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-[#1C2526] text-[11px] font-semibold whitespace-nowrap shadow-xs border border-[#E2E7E4] cursor-pointer"
                  >
                    + {t('adminSupport.guideStatusShortcut')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleShortcutClick(
                        'We provide GORE-TEX waterproof pack covers and high-altitude emergency ponchos at base camp.'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-[#1C2526] text-[11px] font-semibold whitespace-nowrap shadow-xs border border-[#E2E7E4] cursor-pointer"
                  >
                    + {t('adminSupport.rainGearShortcut')}
                  </button>
                </div>

                <div className="rounded-xl bg-white border border-[#E2E7E4] shadow-inner p-3 flex flex-col gap-2">
                  <textarea
                    className="w-full bg-transparent text-[#1C2526] placeholder:text-[#64716D] text-xs sm:text-sm resize-none focus:outline-none"
                    placeholder={t('adminSupport.replyPlaceholder')}
                    rows={3}
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between pt-1 border-t border-[#E2E7E4]">
                    <div className="flex items-center gap-2 text-[#64716D]">
                      <button
                        type="button"
                        onClick={() => showToast(t('adminSupport.attachment'), t('adminSupport.attachmentDialog'))}
                        className="text-xs hover:text-[#1C2526] cursor-pointer"
                        title={t('adminSupport.attachFile')}
                      >
                        📎 File
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyInput((prev) => prev + ' ⛰️')}
                        className="text-xs hover:text-[#1C2526] cursor-pointer"
                        title="Add emoji"
                      >
                        😊
                      </button>
                      <div className="h-4 w-px bg-[#E2E7E4]"></div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[#64716D] hover:text-[#1C2526] text-xs">
                        <input
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          type="checkbox"
                          className="rounded accent-[#173C34]"
                        />
                        <span>{t('adminSupport.internalNote')}</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="px-4 py-2 rounded-xl bg-[#1F4E43] hover:bg-[#173C34] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <span>{t('adminSupport.sendReply')}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: DOSSIER & ACTIONS (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-3.5">
              {/* Customer Profile */}
              <div className="p-4 rounded-2xl bg-white border border-[#E2E7E4] shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-mono text-[#64716D] uppercase tracking-wider">
                    {t('adminSupport.customerProfile')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#E7F2EC] text-[#3d6b5f] font-mono text-[10px] font-bold">
                    ✓ {t('adminSupport.verifiedTraveler')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#ffdbd0] flex items-center justify-center text-[#173C34] font-serif text-lg font-bold">
                    {selectedCustomer.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#1C2526]">
                      {selectedCustomer.name}
                    </span>
                    <span className="font-mono text-[11px] text-[#64716D]">
                      {t('adminSupport.sampleLocalTime')}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7F8F6] flex flex-col gap-1 text-xs border border-[#E2E7E4]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64716D]">{t('adminSupport.phoneLabel')}</span>
                    <span className="font-mono text-[#1C2526] font-bold">+1 (555) 382-9910</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64716D]">{t('account.email')}:</span>
                    <span className="font-mono text-[#1C2526]">eleanor.vance@gmail.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64716D]">{t('adminSupport.completedLabel')}</span>
                    <span className="font-semibold text-[#1C2526]">{t('adminSupport.completedTrips', { count: 3 })}</span>
                  </div>
                </div>
              </div>

              {/* Booked Expedition */}
              <div className="p-4 rounded-2xl bg-white border border-[#E2E7E4] shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-mono text-[#64716D] uppercase tracking-wider">
                    {t('adminSupport.bookedTrip')}
                  </span>
                  <span className="font-mono text-xs text-[#173C34] font-bold">#TRK-98421</span>
                </div>
                <div>
                  <h2 className="font-serif text-base font-bold text-[#1C2526]">
                    Fansipan Cloud Ridge 3D2N
                  </h2>
                  <p className="text-xs text-[#64716D]">Muong Hoa • Tram Ton Pass Trailhead</p>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between py-1 px-2.5 bg-[#F7F8F6] rounded-lg border border-[#E2E7E4]">
                    <span className="text-[#64716D]">{t('adminSupport.localPartnerLabel')}</span>
                    <span className="font-semibold text-[#1C2526]">Sapa Peak Expeditions</span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2.5 bg-[#F7F8F6] rounded-lg border border-[#E2E7E4]">
                    <span className="text-[#64716D]">{t('adminSupport.leadGuideLabel')}</span>
                    <span className="font-semibold text-[#1C2526] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#1F4E43]"></span>
                      Giang A Pao · {t('adminSupport.sampleGuideContact')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2.5 bg-[#F7F8F6] rounded-lg border border-[#E2E7E4]">
                    <span className="text-[#64716D]">{t('adminSupport.meetingPointLabel')}</span>
                    <span className="font-semibold text-[#1C2526]">
                      {rescheduled ? 'Tram Ton Gate (Nov 13, 06:30)' : 'Tram Ton Gate (Nov 12, 06:30)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2.5 bg-[#F7F8F6] rounded-lg border border-[#E2E7E4]">
                    <span className="text-[#64716D]">{t('adminSupport.paymentLabel')}</span>
                    <span className="font-mono text-[#1F4E43] font-bold">
                      {t('adminSupport.sampleDepositPaid')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather Telemetry */}
              <div className="p-4 rounded-2xl bg-white border border-[#E2E7E4] shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#1C2526]">
                    <span className="text-[#173C34]">⛈</span>
                    <span className="text-xs font-bold">{t('adminSupport.sampleWeatherTitle')}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#64716D]">{t('adminSupport.sampleStation')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-[#F7F8F6] flex flex-col items-center text-center border border-[#E2E7E4]">
                    <span className="text-[10px] text-[#64716D]">{t('adminSupport.sampleDayOne')}</span>
                    <span className="text-lg my-0.5">⛅</span>
                    <span className="text-xs font-bold text-[#1C2526]">14°C</span>
                    <span className="font-mono text-[10px] text-[#1F4E43]">{t('adminSupport.rainChance', { percent: 10 })}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex flex-col items-center text-center border border-[#ba1a1a]">
                    <div className="flex items-center gap-0.5 text-[10px] font-bold">
                      <span>{t('adminSupport.sampleDayTwo')}</span>
                      <span>⚠️</span>
                    </div>
                    <span className="text-lg my-0.5">🌧</span>
                    <span className="text-xs font-bold text-[#ba1a1a]">8°C</span>
                    <span className="font-mono text-[10px] font-bold">{t('adminSupport.rainChance', { percent: 85 })}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#E7F2EC] text-[#3d6b5f] flex flex-col items-center text-center border border-[#1F4E43]">
                    <span className="text-[10px] font-bold">{t('adminSupport.sampleDayThree')}</span>
                    <span className="text-lg my-0.5">🌅</span>
                    <span className="text-xs font-bold">11°C</span>
                    <span className="font-mono text-[10px]">{t('adminSupport.cloudSea')}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7F8F6] flex items-start gap-2 border border-[#E2E7E4]">
                  <span className="text-[#824500] text-sm">💡</span>
                  <p className="text-[11px] text-[#1C2526] leading-tight">
                    <strong>{t('adminSupport.sampleAdviceLabel')}</strong> {t('adminSupport.sampleAdvice')}
                  </p>
                </div>
              </div>

              {/* Fast Resolution Tools */}
              <div className="p-4 rounded-2xl bg-[#EEF2EF] border border-[#E2E7E4] shadow-xs flex flex-col gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1C2526]">
                  {t('adminSupport.quickActions')}
                </span>
                <button
                  type="button"
                  onClick={handleRescheduleOneClick}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                    rescheduled
                      ? 'bg-[#1F4E43] text-white'
                      : 'bg-[#1F4E43] hover:bg-[#173C34] text-white'
                  }`}
                >
                  <span>🔄</span>
                  <span>
                    {t(rescheduled ? 'adminSupport.rescheduled' : 'adminSupport.rescheduleOneClick')}
                  </span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => showToast(t('adminSupport.notConnectedTitle'), t('adminSupport.escrowNotConnected'))}
                    className="py-2 px-2.5 rounded-xl bg-white hover:bg-[#F7F8F6] text-[#1C2526] text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-[#E2E7E4] shadow-xs cursor-pointer"
                  >
                    <span>🔒</span>
                    <span>{t('adminSupport.escrowHold')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast(t('adminSupport.notConnectedTitle'), t('adminSupport.radioNotConnected'))}
                    className="py-2 px-2.5 rounded-xl bg-white hover:bg-[#F7F8F6] text-[#1C2526] text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-[#E2E7E4] shadow-xs cursor-pointer"
                  >
                    <span>📻</span>
                    <span>{t('adminSupport.radioGuide')}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => showToast(t('adminSupport.notConnectedTitle'), t('adminSupport.ticketNotConnected'))}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F7F8F6] text-[#1C2526] text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#E2E7E4] shadow-xs cursor-pointer"
                >
                  <span>📱</span>
                  <span>{t('adminSupport.sendTicket')}</span>
                </button>
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

export default AdminUserManagementPage;
