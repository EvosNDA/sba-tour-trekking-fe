import React, { useState } from 'react';
import { ScreenId } from '../../../types/expedition';

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

    const newMsg: ChatMessage = {
      id: 'm_' + Date.now(),
      sender: isInternalNote ? 'system' : 'staff',
      senderName: isInternalNote ? 'Staff Note by K. Vance' : 'K. Vance (You)',
      text: replyInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInternalNote,
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyInput('');
    setIsInternalNote(false);
    showToast('Reply Dispatched', 'Customer received message on live web portal.');
  };

  const handleShortcutClick = (text: string) => {
    setReplyInput(text);
  };

  const handleRescheduleOneClick = () => {
    setRescheduled(true);
    const systemNotice: ChatMessage = {
      id: 'm_' + Date.now(),
      sender: 'system',
      senderName: 'SummitTrails Dispatch System',
      text: 'CONFIRMED: Expedition #TRK-98421 rescheduled by +1 day (New departure: Nov 13, 06:30 at Tram Ton Gate). Ranger Giang A Pao and Sapa Peak Expeditions notified. Zero rescheduling fee applied.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, systemNotice]);
    showToast(
      'Trek Rescheduled (+1 Day)',
      'New date Nov 13–15 synchronized with Fansipan Park Station.'
    );
  };

  const handleResolve = () => {
    showToast(
      'Escalation Resolved',
      'Ticket #TRK-98421 marked as resolved. Customer satisfaction rating prompt dispatched.'
    );
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
    <div className="w-full bg-[#f2fbfc] text-[#141d1e] min-h-screen font-sans flex">
      {/* Ops Sidebar (~72 w) */}
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
                Alpine Ops Core
              </span>
            </div>
          </div>

          <div className="px-3">
            <span className="px-3 font-mono text-[10px] text-[#59413a] uppercase tracking-wider font-bold">
              Staff Workspaces
            </span>
            <nav className="flex flex-col gap-1 mt-2">
              <button
                type="button"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#c2410c] text-white font-semibold text-xs text-left cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span>💬</span>
                  <span>Live Chats &amp; Escalations</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
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
                onClick={() => onNavigate('platform_analytics')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#59413a] hover:bg-[#e0eaeb] hover:text-[#141d1e] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>📊</span>
                <span>Platform Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('partner_company_info')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#59413a] hover:bg-[#e0eaeb] hover:text-[#141d1e] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🛡</span>
                <span>Partner Verifications</span>
              </button>

              <div className="flex items-center justify-between px-3 py-2 rounded-xl text-[#59413a] text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span>🚨</span>
                  <span>Incident &amp; SOS Reports</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] font-mono text-[10px] font-bold">
                  0 HIGH
                </span>
              </div>
            </nav>
          </div>

          <div className="px-3">
            <span className="px-3 font-mono text-[10px] text-[#59413a] uppercase tracking-wider font-bold">
              System Dispatch
            </span>
            <nav className="flex flex-col gap-1 mt-2">
              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#59413a] hover:bg-[#e0eaeb] hover:text-[#141d1e] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🏪</span>
                <span>Marketplace View</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('eticket')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#59413a] hover:bg-[#e0eaeb] hover:text-[#141d1e] text-xs font-medium text-left cursor-pointer transition-colors"
              >
                <span>🎟</span>
                <span>E-Ticket Gate View</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="px-3">
          <div className="p-2.5 rounded-xl bg-white border border-[#dbe4e5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39675b]"></span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#141d1e]">Field Node 04</span>
                <span className="font-mono text-[9px] text-[#59413a]">46.5402° N, 7.9836° E</span>
              </div>
            </div>
            <span className="text-[#39675b] text-xs">☁</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#dbe4e5] z-30 flex items-center justify-between px-6 sticky top-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#141d1e] tracking-tight">
                SummitTrails Support Ops
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg bg-[#e0eaeb] text-[#141d1e] font-mono">
                Dispatch V2
              </span>
            </div>
            <div className="h-4 w-px bg-[#dbe4e5] hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#b9eadb]">
              <span className="w-2 h-2 rounded-full bg-[#39675b]"></span>
              <span className="text-[11px] font-bold text-[#3d6b5f]">Online / Ready</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#59413a] hover:bg-[#ecf5f6] hover:text-[#141d1e] transition-colors cursor-pointer"
              >
                🔔
              </button>
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#9b2f00] text-white font-mono text-[10px] flex items-center justify-center font-bold">
                3
              </span>
            </div>
            <div className="h-6 w-px bg-[#dbe4e5]"></div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-[#141d1e] leading-tight">K. Vance</span>
                <span className="font-mono text-[10px] text-[#59413a]">Support Specialist</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#9b2f00] text-white flex items-center justify-center font-bold text-xs">
                KV
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 flex flex-col gap-5">
          {/* Desk Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white shadow-sm border border-[#dbe4e5]">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#39675b] animate-pulse"></span>
                  <span className="text-[11px] font-bold text-[#39675b] uppercase tracking-wider font-mono">
                    Live Operations Desk
                  </span>
                </div>
                <h1 className="font-serif text-2xl text-[#141d1e] tracking-tight mt-0.5 font-bold">
                  Customer Escalations Desk
                </h1>
              </div>
              <div className="hidden md:block h-10 w-px bg-[#dbe4e5]"></div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ffdbd0] text-[#390c00] text-xs font-bold">
                  <span>🚨</span>
                  <span>3 In Queue</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#e0eaeb] text-[#141d1e] text-xs font-medium">
                  <span>⏱</span>
                  <span>1m 15s Avg Queue</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#b9eadb] text-[#3d6b5f] text-xs font-bold">
                  <span>✓</span>
                  <span>98.4% Solved</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end lg:self-auto">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#e6f0f1] border border-[#dbe4e5]">
                <span className="text-xs text-[#141d1e] font-semibold">Auto-Accept Next</span>
                <button
                  type="button"
                  onClick={() => setAutoAccept(!autoAccept)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-200 cursor-pointer ${
                    autoAccept ? 'bg-[#c2410c]' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ${
                      autoAccept ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ecf5f6] text-[#59413a] font-mono text-xs border border-[#dbe4e5]">
                <span className="text-[#9b2f00]">📡</span>
                <span>GATEWAY-SAP-02</span>
              </div>
            </div>
          </div>

          {/* 3-Column Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* COLUMN 1: Queue List (~3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-3.5">
              <div className="p-3.5 rounded-2xl bg-white border border-[#dbe4e5] shadow-xs flex flex-col gap-3">
                <div className="relative w-full">
                  <input
                    className="w-full pl-8 pr-3 py-2 bg-[#ecf5f6] text-[#141d1e] placeholder:text-[#59413a] rounded-xl text-xs border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                    placeholder="Search customer or booking..."
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
                        ? 'bg-[#9b2f00] text-white shadow-xs'
                        : 'bg-[#e6f0f1] text-[#59413a] hover:text-[#141d1e]'
                    }`}
                  >
                    Waiting (3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueTab('active')}
                    className={`flex-1 py-1.5 rounded-lg text-xs text-center font-medium transition-all cursor-pointer ${
                      queueTab === 'active'
                        ? 'bg-[#9b2f00] text-white shadow-xs'
                        : 'bg-[#e6f0f1] text-[#59413a] hover:text-[#141d1e]'
                    }`}
                  >
                    Active (2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueTab('done')}
                    className={`flex-1 py-1.5 rounded-lg text-xs text-center font-medium transition-all cursor-pointer ${
                      queueTab === 'done'
                        ? 'bg-[#9b2f00] text-white shadow-xs'
                        : 'bg-[#e6f0f1] text-[#59413a] hover:text-[#141d1e]'
                    }`}
                  >
                    Done (19)
                  </button>
                </div>
              </div>

              {/* Queue Cards */}
              <div className="flex flex-col gap-2.5">
                {filteredCustomers.map((cust) => {
                  const isSelected = cust.id === selectedCustomerId;
                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-2 border-[#c2410c] shadow-md ring-2 ring-[#c2410c]/20'
                          : 'bg-white border border-[#dbe4e5] shadow-xs hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              cust.isOnline ? 'bg-[#39675b]' : 'bg-[#824500]'
                            }`}
                          ></span>
                          <span className="text-sm text-[#141d1e] font-bold">{cust.name}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            cust.priority === 'HIGH'
                              ? 'bg-[#ffdad6] text-[#ba1a1a]'
                              : 'bg-[#e6f0f1] text-[#59413a]'
                          }`}
                        >
                          {cust.priority}
                        </span>
                      </div>
                      <p className="text-xs text-[#59413a] mt-1 font-medium">{cust.tourName}</p>

                      <div className="mt-2.5 p-2 rounded-xl bg-[#ecf5f6] flex flex-col gap-0.5 border border-[#dbe4e5]">
                        <div className="flex items-center gap-1.5 text-[#9b2f00]">
                          <span>🎧</span>
                          <span className="text-[11px] font-bold">{cust.typeBadge}</span>
                        </div>
                        <p className="text-xs text-[#141d1e] truncate">{cust.summary}</p>
                      </div>

                      <div className="mt-2.5 pt-2 flex items-center justify-between text-[#59413a] font-mono text-[11px] border-t border-[#dbe4e5]">
                        <span>{cust.ref}</span>
                        {isSelected ? (
                          <span className="text-[#39675b] font-bold">In Chat With You</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomerId(cust.id);
                              showToast('Customer Picked Up', `Assigned ${cust.name} to your queue.`);
                            }}
                            className="px-2.5 py-0.5 rounded-lg bg-[#e0eaeb] hover:bg-[#c2410c] hover:text-white transition-colors text-[10px] font-bold cursor-pointer"
                          >
                            Pick Up
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Agent Status */}
              <div className="p-3 rounded-2xl bg-[#ecf5f6] border border-[#dbe4e5] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#b9eadb] text-[#3d6b5f] flex items-center justify-center font-bold text-xs">
                    KV
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#141d1e] font-bold">Agent Vance</span>
                    <span className="font-mono text-[10px] text-[#39675b]">
                      Accepting escalation chats
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#b9eadb] text-[#3d6b5f] font-mono text-[10px] font-bold">
                  2 Active
                </span>
              </div>
            </div>

            {/* COLUMN 2: LIVE CHAT CONVERSATION (5 cols) */}
            <div className="lg:col-span-5 flex flex-col rounded-2xl bg-white border border-[#dbe4e5] shadow-sm overflow-hidden">
              {/* Chat Top Banner */}
              <div className="p-4 bg-[#ecf5f6] border-b border-[#dbe4e5] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#ffdbd0] text-[#390c00] flex items-center justify-center font-bold text-sm">
                        {selectedCustomer.initials}
                      </div>
                      <span className="w-3 h-3 rounded-full bg-[#39675b] absolute bottom-0 right-0 ring-2 ring-white"></span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#141d1e]">
                          {selectedCustomer.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#dbe4e5] text-[#59413a] text-[10px] font-bold font-mono">
                          {selectedCustomer.guests}
                        </span>
                      </div>
                      <span className="text-xs text-[#59413a]">
                        Fansipan Cloud Ridge • Nov 12 - 14 {rescheduled && '(Rescheduled to Nov 13–15)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => showToast('Transferred', 'Escalation transferred to Lead Guide Desk.')}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-[#e6f0f1] text-[#59413a] flex items-center justify-center transition-colors border border-[#dbe4e5] cursor-pointer"
                      title="Transfer escalation"
                    >
                      ↪
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Guide Invited', 'Ranger Giang A Pao invited to chat room.')}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#e6f0f1] text-[#141d1e] text-xs font-semibold flex items-center gap-1 transition-colors border border-[#dbe4e5] cursor-pointer"
                    >
                      <span>👤</span>
                      <span>Guide A Pao</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResolve}
                      className="px-3 py-1.5 rounded-xl bg-[#b9eadb] hover:bg-[#a0d0c2] text-[#3d6b5f] text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>✓</span>
                      <span>Resolve</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#59413a] pt-1 border-t border-[#dbe4e5]">
                  <div className="flex items-center gap-1 text-[#39675b] font-semibold">
                    <span>⚡</span>
                    <span>Live Connected • Customer is typing...</span>
                  </div>
                  <span>Session: #SES-44910</span>
                </div>
              </div>

              {/* AI CONCIERGE HANDOFF SUMMARY CARD */}
              <div className="mx-4 mt-4 p-3.5 bg-[#b9eadb]/30 rounded-xl border border-[#39675b]/30 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#00201a]">
                    <span>🤖</span>
                    <span className="text-xs font-bold">AI Concierge Handoff Summary</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#59413a]">2m ago</span>
                </div>
                <p className="text-xs text-[#141d1e] leading-snug">
                  Customer asked AI Bot about the <strong>heavy rain forecast on Nov 13</strong>. Customer requested to move trek dates forward by 1 day at zero fee to guarantee sunrise views.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAiTranscript(!showAiTranscript)}
                  className="self-start mt-0.5 flex items-center gap-1 text-[#9b2f00] hover:underline text-xs font-bold cursor-pointer"
                >
                  <span>{showAiTranscript ? '▲ Hide' : '▼ View'} 4 previous AI bot messages</span>
                </button>
                {showAiTranscript && (
                  <div className="mt-1.5 p-2.5 rounded-lg bg-white text-xs flex flex-col gap-1.5 border border-[#dbe4e5]">
                    <div className="text-[#59413a] text-[11px]">
                      <strong className="text-[#141d1e]">10:39 AM [Customer]:</strong> Is it safe to summit Fansipan with Nov 13 rain forecast?
                    </div>
                    <div className="text-[#59413a] text-[11px]">
                      <strong className="text-[#39675b]">10:40 AM [AI]:</strong> Treks run in moderate rain. We provide ponchos and waterproof pack liners. Severe weather triggers summit closure.
                    </div>
                    <div className="text-[#59413a] text-[11px]">
                      <strong className="text-[#141d1e]">10:41 AM [Customer]:</strong> We want sunrise photos. Can we move to Nov 14?
                    </div>
                    <div className="text-[#59413a] text-[11px]">
                      <strong className="text-[#39675b]">10:41 AM [AI]:</strong> Rescheduling requires staff confirmation. Connecting you to Sapa dispatch now.
                    </div>
                  </div>
                )}
              </div>

              {/* Message Stream */}
              <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4 min-h-[300px] max-h-[440px]">
                <div className="flex items-center gap-2 justify-center my-1">
                  <div className="h-px flex-1 bg-[#dbe4e5]"></div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ecf5f6] text-[#59413a] font-mono text-[10px]">
                    Handoff completed to K. Vance at 10:42 AM
                  </span>
                  <div className="h-px flex-1 bg-[#dbe4e5]"></div>
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
                        <div className="w-7 h-7 rounded-full bg-[#9b2f00] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          KV
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <div className="p-3 rounded-2xl rounded-tr-none bg-[#9b2f00] text-white text-xs sm:text-sm shadow-xs leading-relaxed">
                            {msg.text}
                          </div>
                          <span className="font-mono text-[#59413a] text-[10px] pr-1">
                            {msg.time} • Sent by You
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
                        <div className="p-3 rounded-2xl rounded-tl-none bg-[#ecf5f6] text-[#141d1e] text-xs sm:text-sm shadow-xs border border-[#dbe4e5] leading-relaxed">
                          {msg.text}
                        </div>
                        <span className="font-mono text-[#59413a] text-[10px] pl-1">
                          {msg.time} • Delivered
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Composer */}
              <div className="p-3.5 bg-[#ecf5f6] border-t border-[#dbe4e5] flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <span className="font-mono text-[10px] text-[#59413a] whitespace-nowrap font-bold">
                    Shortcuts:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleShortcutClick(
                        'I looked at the mountain radar and can confirm we have guide capacity to move your summit departure to Nov 14 at zero extra fee!'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-[#141d1e] text-[11px] font-semibold whitespace-nowrap shadow-xs border border-[#dbe4e5] cursor-pointer"
                  >
                    + Weather Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleShortcutClick(
                        'Your expedition has been moved forward +1 day. New departure date: Nov 13 at 06:30 Tram Ton gate.'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-[#141d1e] text-[11px] font-semibold whitespace-nowrap shadow-xs border border-[#dbe4e5] cursor-pointer"
                  >
                    + Confirm +1 Day
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleShortcutClick(
                        'Lead Guide Giang A Pao is on frequency VHF 147.425 and has confirmed trail conditions are clear.'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-[#141d1e] text-[11px] font-semibold whitespace-nowrap shadow-xs border border-[#dbe4e5] cursor-pointer"
                  >
                    + Guide Status
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleShortcutClick(
                        'We provide GORE-TEX waterproof pack covers and high-altitude emergency ponchos at base camp.'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-[#141d1e] text-[11px] font-semibold whitespace-nowrap shadow-xs border border-[#dbe4e5] cursor-pointer"
                  >
                    + Rain Gear List
                  </button>
                </div>

                <div className="rounded-xl bg-white border border-[#dbe4e5] shadow-inner p-3 flex flex-col gap-2">
                  <textarea
                    className="w-full bg-transparent text-[#141d1e] placeholder:text-[#59413a] text-xs sm:text-sm resize-none focus:outline-none"
                    placeholder="Type reply to customer (Press Enter to send, Shift+Enter for new line)..."
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
                  <div className="flex items-center justify-between pt-1 border-t border-[#dbe4e5]">
                    <div className="flex items-center gap-2 text-[#59413a]">
                      <button
                        type="button"
                        onClick={() => showToast('Attachment', 'Attach file dialog opened.')}
                        className="text-xs hover:text-[#141d1e] cursor-pointer"
                        title="Attach file"
                      >
                        📎 File
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyInput((prev) => prev + ' ⛰️')}
                        className="text-xs hover:text-[#141d1e] cursor-pointer"
                        title="Add emoji"
                      >
                        😊
                      </button>
                      <div className="h-4 w-px bg-[#dbe4e5]"></div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[#59413a] hover:text-[#141d1e] text-xs">
                        <input
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          type="checkbox"
                          className="rounded accent-[#9b2f00]"
                        />
                        <span>Internal Staff Note</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="px-4 py-2 rounded-xl bg-[#c2410c] hover:bg-[#9b2f00] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <span>Send Reply</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: DOSSIER & ACTIONS (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-3.5">
              {/* Customer Profile */}
              <div className="p-4 rounded-2xl bg-white border border-[#dbe4e5] shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-mono text-[#59413a] uppercase tracking-wider">
                    Customer Profile
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#b9eadb] text-[#3d6b5f] font-mono text-[10px] font-bold">
                    ✓ Verified Traveler
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#ffdbd0] flex items-center justify-center text-[#9b2f00] font-serif text-lg font-bold">
                    {selectedCustomer.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#141d1e]">
                      {selectedCustomer.name}
                    </span>
                    <span className="font-mono text-[11px] text-[#59413a]">
                      UTC+7 (Local Sapa Time)
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#ecf5f6] flex flex-col gap-1 text-xs border border-[#dbe4e5]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#59413a]">WhatsApp / Tel:</span>
                    <span className="font-mono text-[#141d1e] font-bold">+1 (555) 382-9910</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#59413a]">Email:</span>
                    <span className="font-mono text-[#141d1e]">eleanor.vance@gmail.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#59413a]">Completed:</span>
                    <span className="font-semibold text-[#141d1e]">3 Previous Expeditions</span>
                  </div>
                </div>
              </div>

              {/* Booked Expedition */}
              <div className="p-4 rounded-2xl bg-white border border-[#dbe4e5] shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-mono text-[#59413a] uppercase tracking-wider">
                    Booked Expedition
                  </span>
                  <span className="font-mono text-xs text-[#9b2f00] font-bold">#TRK-98421</span>
                </div>
                <div>
                  <h2 className="font-serif text-base font-bold text-[#141d1e]">
                    Fansipan Cloud Ridge 3D2N
                  </h2>
                  <p className="text-xs text-[#59413a]">Muong Hoa • Tram Ton Pass Trailhead</p>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between py-1 px-2.5 bg-[#ecf5f6] rounded-lg border border-[#dbe4e5]">
                    <span className="text-[#59413a]">Local Partner:</span>
                    <span className="font-semibold text-[#141d1e]">Sapa Peak Expeditions</span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2.5 bg-[#ecf5f6] rounded-lg border border-[#dbe4e5]">
                    <span className="text-[#59413a]">Lead Guide:</span>
                    <span className="font-semibold text-[#141d1e] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#39675b]"></span>
                      Giang A Pao (VHF 147.425)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2.5 bg-[#ecf5f6] rounded-lg border border-[#dbe4e5]">
                    <span className="text-[#59413a]">Meeting Spot:</span>
                    <span className="font-semibold text-[#141d1e]">
                      {rescheduled ? 'Tram Ton Gate (Nov 13, 06:30)' : 'Tram Ton Gate (Nov 12, 06:30)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2.5 bg-[#ecf5f6] rounded-lg border border-[#dbe4e5]">
                    <span className="text-[#59413a]">Payment:</span>
                    <span className="font-mono text-[#39675b] font-bold">
                      Deposit Paid (1,080k VND)
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather Telemetry */}
              <div className="p-4 rounded-2xl bg-white border border-[#dbe4e5] shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#141d1e]">
                    <span className="text-[#9b2f00]">⛈</span>
                    <span className="text-xs font-bold">Fansipan Mountain Telemetry</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#59413a]">3,143m Station</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-[#ecf5f6] flex flex-col items-center text-center border border-[#dbe4e5]">
                    <span className="text-[10px] text-[#59413a]">Tue Nov 12</span>
                    <span className="text-lg my-0.5">⛅</span>
                    <span className="text-xs font-bold text-[#141d1e]">14°C</span>
                    <span className="font-mono text-[10px] text-[#39675b]">10% Rain</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex flex-col items-center text-center border border-[#ba1a1a]">
                    <div className="flex items-center gap-0.5 text-[10px] font-bold">
                      <span>Wed Nov 13</span>
                      <span>⚠️</span>
                    </div>
                    <span className="text-lg my-0.5">🌧</span>
                    <span className="text-xs font-bold text-[#ba1a1a]">8°C</span>
                    <span className="font-mono text-[10px] font-bold">85% Rain</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#b9eadb] text-[#3d6b5f] flex flex-col items-center text-center border border-[#39675b]">
                    <span className="text-[10px] font-bold">Thu Nov 14</span>
                    <span className="text-lg my-0.5">🌅</span>
                    <span className="text-xs font-bold">11°C</span>
                    <span className="font-mono text-[10px]">Cloud Sea</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#ecf5f6] flex items-start gap-2 border border-[#dbe4e5]">
                  <span className="text-[#824500] text-sm">💡</span>
                  <p className="text-[11px] text-[#141d1e] leading-tight">
                    <strong>Dispatch Advice:</strong> Shifting expedition by +1 day (Nov 13–15) guarantees clear sea-of-clouds sunrise on Nov 14.
                  </p>
                </div>
              </div>

              {/* Fast Resolution Tools */}
              <div className="p-4 rounded-2xl bg-[#e0eaeb] border border-[#dbe4e5] shadow-xs flex flex-col gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#141d1e]">
                  Fast Resolution Tools
                </span>
                <button
                  type="button"
                  onClick={handleRescheduleOneClick}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                    rescheduled
                      ? 'bg-[#39675b] text-white'
                      : 'bg-[#c2410c] hover:bg-[#9b2f00] text-white'
                  }`}
                >
                  <span>🔄</span>
                  <span>
                    {rescheduled ? 'Rescheduled (+1 Day Active)' : '1-Click Reschedule (+1 Day to Nov 13-15)'}
                  </span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => showToast('Escrow Held', '30% deposit placed in protected hold pending weather check.')}
                    className="py-2 px-2.5 rounded-xl bg-white hover:bg-[#ecf5f6] text-[#141d1e] text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-[#dbe4e5] shadow-xs cursor-pointer"
                  >
                    <span>🔒</span>
                    <span>Escrow Hold</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Radio Paged', 'Dispatched alert over VHF 147.425 to Ranger Giang A Pao.')}
                    className="py-2 px-2.5 rounded-xl bg-white hover:bg-[#ecf5f6] text-[#141d1e] text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-[#dbe4e5] shadow-xs cursor-pointer"
                  >
                    <span>📻</span>
                    <span>Radio Guide</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('SMS / WhatsApp Dispatched', 'Updated e-ticket link sent to +1 (555) 382-9910.')}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#ecf5f6] text-[#141d1e] text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#dbe4e5] shadow-xs cursor-pointer"
                >
                  <span>📱</span>
                  <span>Send Updated E-Ticket via WhatsApp / SMS</span>
                </button>
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

export default AdminUserManagementPage;
