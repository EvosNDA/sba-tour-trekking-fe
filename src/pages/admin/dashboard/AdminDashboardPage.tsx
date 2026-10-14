import React, { useState } from 'react';
import { ScreenId } from '../../../types/expedition';

export interface AdminDashboardPageProps {
  onNavigate?: (screen: ScreenId) => void;
}

interface QueueTour {
  id: string;
  ref: string;
  title: string;
  partner: string;
  partnerTier: string;
  duration: string;
  priceUSD: number;
  priceVND: string;
  maxGuests: number;
  status: 'needs_review' | 'changes_sent' | 'approved' | 'denied';
  submittedTime: string;
  isResubmitted?: boolean;
}

const INITIAL_QUEUE: QueueTour[] = [
  {
    id: 'fansipan-3d2n',
    ref: '#TR-VN-4402',
    title: 'Fansipan 3D2N Cloud Ridge & Pine Forest Camp',
    partner: 'Sapa Peak Expeditions Co.',
    partnerTier: 'Tier-1 Partner',
    duration: '3D / 2N',
    priceUSD: 128,
    priceVND: '3,200,000 VND',
    maxGuests: 10,
    status: 'needs_review',
    submittedTime: 'Submitted 4h ago',
  },
  {
    id: 'pu-luong',
    ref: '#TR-VN-4403',
    title: 'Pu Luong Valley Secret Rice Terraces Trek',
    partner: 'Highland Trails Vietnam',
    partnerTier: 'Standard Partner',
    duration: '2D / 1N',
    priceUSD: 84,
    priceVND: '2,100,000 VND',
    maxGuests: 12,
    status: 'needs_review',
    submittedTime: 'Submitted 9h ago',
  },
  {
    id: 'bach-ma',
    ref: '#TR-VN-4404',
    title: 'Bach Ma Summit to Jungle Waterfalls Route',
    partner: 'Annamite Range Explorers',
    partnerTier: 'Tier-1 Partner',
    duration: '1 Day Alpine Hike',
    priceUSD: 55,
    priceVND: '1,380,000 VND',
    maxGuests: 8,
    status: 'changes_sent',
    submittedTime: 'Resubmitted 2h ago',
    isResubmitted: true,
  },
  {
    id: 'ta-xua',
    ref: '#TR-VN-4405',
    title: 'Ta Xua Sea of Clouds Overnight Traverse',
    partner: 'Dinosaur Ridge Treks',
    partnerTier: 'Standard Partner',
    duration: '2D / 1N',
    priceUSD: 95,
    priceVND: '2,400,000 VND',
    maxGuests: 10,
    status: 'needs_review',
    submittedTime: 'Submitted 18h ago',
  },
];

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigate = () => {},
}) => {
  const [selectedTourId, setSelectedTourId] = useState('fansipan-3d2n');
  const [filterTab, setFilterTab] = useState<'needs_review' | 'changes_sent' | 'approved' | 'denied'>('needs_review');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewNote, setReviewNote] = useState(
    'All 5 safety criteria verified. Lead guide A Pao has a valid WFR badge and Garmin inReach beacon is active. Tour is ready to go live on the public explore page.'
  );

  // Tour status overrides
  const [tourStatuses, setTourStatuses] = useState<{ [id: string]: string }>({
    'fansipan-3d2n': 'Needs Review',
  });

  // Toast
  const [toast, setToast] = useState<{ show: boolean; title: string; desc: string; type: 'success' | 'warning' | 'error' }>({
    show: false,
    title: '',
    desc: '',
    type: 'success',
  });

  const showToast = (title: string, desc: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ show: true, title, desc, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleInsertTag = (tag: string) => {
    setReviewNote(tag);
  };

  const handleDecision = (decision: 'Approved & Published' | 'Changes Requested' | 'Denied') => {
    if (decision === 'Approved & Published') {
      setTourStatuses((prev) => ({ ...prev, [selectedTourId]: 'Approved' }));
      showToast(
        'Tour Accepted & Published!',
        'Fansipan 3D2N is now live for guest bookings on the WeTrek Marketplace.',
        'success'
      );
    } else if (decision === 'Changes Requested') {
      setTourStatuses((prev) => ({ ...prev, [selectedTourId]: 'Changes Requested' }));
      showToast(
        'Feedback Sent to Partner',
        'Partner was notified to fix the requested items in their portal.',
        'warning'
      );
    } else {
      setTourStatuses((prev) => ({ ...prev, [selectedTourId]: 'Denied' }));
      showToast(
        'Tour Submission Denied',
        'Tour submission was declined and moved to archive.',
        'error'
      );
    }
  };

  const selectedTour = INITIAL_QUEUE.find((t) => t.id === selectedTourId) || INITIAL_QUEUE[0];
  const filteredQueue = INITIAL_QUEUE.filter(
    (t) =>
      (searchTerm === '' ||
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.partner.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full bg-[#f2fbfc] text-[#141d1e] min-h-screen font-sans">
      {/* Console Top Header */}
      <header className="sticky top-10 z-40 bg-white/95 backdrop-blur-md border-b border-[#dbe4e5] px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('marketplace')}
              className="flex items-center gap-2 cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded bg-[#c2410c] text-white flex items-center justify-center font-bold text-sm">
                ⛰
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-lg font-bold tracking-tight text-[#141d1e]">
                    SummitTrails
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#c2410c] text-white font-mono text-[10px] uppercase font-bold tracking-wider">
                    Ops Console
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#59413a]">
                  Quality Control &amp; Expeditions Backoffice
                </span>
              </div>
            </button>
            <span className="text-stone-300 hidden sm:inline">|</span>
            <button
              onClick={() => onNavigate('marketplace')}
              className="hidden md:inline-flex items-center gap-1 text-xs text-[#59413a] hover:text-[#141d1e] cursor-pointer"
            >
              ← Back to Marketplace
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('partner_certificates')}
              className="hidden lg:inline-flex text-xs font-semibold text-[#39675b] hover:text-[#204f44] px-2.5 py-1 bg-[#ecf5f6] rounded border border-[#dbe4e5]"
            >
              Partner Onboarding Wizard →
            </button>

            <div className="flex items-center gap-2.5 bg-[#ecf5f6] py-1 px-3 rounded-full border border-[#dbe4e5]">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-[#141d1e]">K. Vance</span>
                <span className="font-mono text-[10px] text-[#39675b] font-bold uppercase">
                  Quality Officer
                </span>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#9b2f00] text-white flex items-center justify-center font-bold text-xs">
                KV
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Operational Metric Bar */}
        <div className="w-full bg-white shadow-xs rounded-xl p-5 mb-6 border border-[#dbe4e5]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#c2410c] text-white flex items-center justify-center text-lg shadow-xs">
                📋
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl font-bold text-[#141d1e]">
                    Tour Review Desk
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#b9eadb] text-[#3d6b5f] font-mono text-[10px] uppercase font-bold">
                    Active Duty
                  </span>
                </div>
                <p className="text-xs text-[#59413a]">
                  Check tour safety, guide badges, and park permits before publishing.
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5]">
                <div className="w-8 h-8 rounded-lg bg-[#ffdbd0] text-[#9b2f00] flex items-center justify-center font-bold text-sm">
                  ⏱
                </div>
                <div>
                  <div className="text-sm font-bold text-[#9b2f00] leading-tight">7 Tours</div>
                  <div className="font-mono text-[10px] text-[#59413a] uppercase">Need Review Today</div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5]">
                <div className="w-8 h-8 rounded-lg bg-[#b9eadb] text-[#39675b] flex items-center justify-center font-bold text-sm">
                  ⚡
                </div>
                <div>
                  <div className="text-sm font-bold text-[#141d1e] leading-tight">18 Hours</div>
                  <div className="font-mono text-[10px] text-[#59413a] uppercase">Average Review Speed</div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#b9eadb]/40 border border-[#b9eadb]">
                <div className="w-8 h-8 rounded-lg bg-[#39675b] text-white flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <div className="text-sm font-bold text-[#39675b] leading-tight">24 Tours</div>
                  <div className="font-mono text-[10px] text-[#3d6b5f] uppercase">Approved This Week</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Split Console */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR: Submissions Queue (4 cols) */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
            {/* List Controls */}
            <div className="bg-white rounded-xl p-4 shadow-xs border border-[#dbe4e5] space-y-3">
              <div className="relative">
                <input
                  className="w-full bg-[#ecf5f6] text-[#141d1e] pl-8 pr-4 py-2 text-xs rounded-lg border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                  placeholder="Search tour title or partner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  type="text"
                />
                <span className="absolute left-2.5 top-2 text-[#59413a] text-xs">🔍</span>
              </div>

              {/* Filter Pill Row */}
              <div className="flex flex-wrap gap-1 p-1 bg-[#ecf5f6] rounded-lg border border-[#dbe4e5]">
                <button
                  type="button"
                  onClick={() => setFilterTab('needs_review')}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-bold text-center cursor-pointer ${
                    filterTab === 'needs_review'
                      ? 'bg-[#c2410c] text-white shadow-xs'
                      : 'text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Needs Review (7)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('changes_sent')}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-bold text-center cursor-pointer ${
                    filterTab === 'changes_sent'
                      ? 'bg-[#c2410c] text-white shadow-xs'
                      : 'text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Changes (3)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('approved')}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-bold text-center cursor-pointer ${
                    filterTab === 'approved'
                      ? 'bg-[#c2410c] text-white shadow-xs'
                      : 'text-[#59413a] hover:text-[#141d1e]'
                  }`}
                >
                  Approved (142)
                </button>
              </div>
            </div>

            {/* Queue Cards */}
            <div className="space-y-3">
              {filteredQueue.map((item) => {
                const isSelected = item.id === selectedTourId;
                const statusBadge = tourStatuses[item.id] || (item.isResubmitted ? 'Resubmitted' : 'Needs Review');
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTourId(item.id)}
                    className={`bg-white rounded-xl p-4 transition-all cursor-pointer border ${
                      isSelected
                        ? 'border-[#c2410c] ring-2 ring-[#c2410c]/30 shadow-md'
                        : 'border-[#dbe4e5] hover:border-stone-400 opacity-90 hover:opacity-100 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded bg-[#ffdbd0] text-[#390c00] font-mono text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c2410c] animate-pulse"></span>
                        {item.submittedTime}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#b9eadb] text-[#3d6b5f] font-mono text-[10px] font-bold">
                        {statusBadge === 'Approved' ? '✓ Approved' : item.partnerTier}
                      </span>
                    </div>

                    <h3 className="font-serif text-base leading-snug text-[#141d1e] font-bold">
                      {item.title}
                    </h3>

                    <p className="text-xs text-[#59413a] mt-1 flex items-center gap-1">
                      <span className="text-[#9b2f00]">⛰</span>
                      <span>{item.partner}</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2 bg-[#ecf5f6] rounded-lg p-2 text-center border border-[#dbe4e5]">
                      <div>
                        <div className="font-mono text-[9px] text-[#59413a] uppercase">Duration</div>
                        <div className="text-xs text-[#141d1e] font-bold">{item.duration}</div>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-[#59413a] uppercase">Price</div>
                        <div className="text-xs text-[#9b2f00] font-bold">${item.priceUSD}</div>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-[#59413a] uppercase">Max Hikers</div>
                        <div className="text-xs text-[#141d1e] font-bold">{item.maxGuests} guests</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT INSPECTION CONSOLE (8 cols) */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
            {/* Tour Header & Action Bar */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbe4e5]">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#e6f0f1]">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded bg-[#c2410c] text-white font-mono text-[10px] uppercase font-bold tracking-wider">
                      {selectedTour.ref}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold flex items-center gap-1">
                      <span>✓</span> Verified Partner #HLN-2024-X9
                    </span>
                    <span className="text-[#59413a] font-mono text-[10px]">
                      Submitted Oct 24, 08:30 AM
                    </span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl text-[#141d1e] leading-tight font-bold">
                    {selectedTour.title}
                  </h1>
                  <p className="text-xs text-[#59413a]">
                    Offered by <span className="font-bold text-[#141d1e]">{selectedTour.partner}</span> (Hoang Lien Son Concession)
                  </p>
                </div>

                {/* Top Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showToast('Notes Saved', 'Internal notes updated for tour.')}
                    className="px-3 py-1.5 rounded-lg bg-[#ecf5f6] text-[#141d1e] text-xs font-semibold hover:bg-[#e0eaeb] transition-colors border border-[#dbe4e5] cursor-pointer"
                  >
                    Save Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('Changes Requested')}
                    className="px-3 py-1.5 rounded-lg bg-[#ffdbd0] text-[#6e3900] text-xs font-bold hover:bg-[#ffb59d] transition-colors cursor-pointer"
                  >
                    Ask Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('Approved & Published')}
                    className="px-4 py-1.5 rounded-lg bg-[#39675b] text-white text-xs font-bold hover:bg-[#204f44] transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>✓</span> Accept &amp; Publish
                  </button>
                </div>
              </div>

              {/* Key Tour Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#ecf5f6] rounded-xl p-4 mt-4 border border-[#dbe4e5]">
                <div>
                  <div className="font-mono text-[10px] text-[#59413a] uppercase font-bold">Price per guest</div>
                  <div className="text-sm text-[#9b2f00] font-bold mt-0.5">{selectedTour.priceVND}</div>
                  <div className="font-mono text-[11px] text-[#59413a]">approx. ${selectedTour.priceUSD} USD</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-[#59413a] uppercase font-bold">Duration &amp; Terrain</div>
                  <div className="text-sm text-[#141d1e] font-bold mt-0.5">{selectedTour.duration}</div>
                  <div className="font-mono text-[11px] text-[#39675b] font-bold">Grade 3 (Challenging)</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-[#59413a] uppercase font-bold">Party Size Limit</div>
                  <div className="text-sm text-[#141d1e] font-bold mt-0.5">Max {selectedTour.maxGuests} Hikers</div>
                  <div className="font-mono text-[11px] text-[#59413a]">Min. age 16 years</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-[#59413a] uppercase font-bold">Guide Ratio</div>
                  <div className="text-sm text-[#39675b] font-bold mt-0.5">1 Guide : 5 Hikers</div>
                  <div className="font-mono text-[11px] text-[#39675b] flex items-center gap-0.5">
                    <span>✓</span> Meets Platform Standard
                  </div>
                </div>
              </div>
            </div>

            {/* Verification & Safety Checklist Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbe4e5] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e6f0f1]">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#b9eadb] text-[#39675b] flex items-center justify-center font-bold text-sm">
                    🛡
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-[#141d1e]">
                      Staff Safety &amp; Rule Checklist
                    </h2>
                    <p className="text-xs text-[#59413a]">
                      Confirm all five safety checks before approving the trek.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#b9eadb] text-[#3d6b5f] font-mono text-xs font-bold">
                  5 / 5 Cleared
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Item 1 */}
                <div className="p-3.5 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-[#39675b] font-bold text-sm mt-0.5">✓</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#141d1e]">1. National Park Permit</span>
                        <span className="px-2 py-0.2 rounded bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
                          Valid Concession
                        </span>
                      </div>
                      <p className="text-xs text-[#59413a] mt-0.5">
                        Hoang Lien National Park permit code <span className="font-mono text-[#141d1e] font-bold">HLNP-2024-C92</span> is active through December 31, 2026.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-[#b9eadb] text-[#39675b] font-mono text-[11px] font-bold whitespace-nowrap">
                    Verified OK
                  </span>
                </div>

                {/* Item 2 */}
                <div className="p-3.5 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-[#39675b] font-bold text-sm mt-0.5">✓</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#141d1e]">2. Lead Guide First-Aid License</span>
                        <span className="px-2 py-0.2 rounded bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
                          WFR Certified
                        </span>
                      </div>
                      <p className="text-xs text-[#59413a] mt-0.5">
                        Lead Guide <span className="font-bold text-[#141d1e]">Giang A Pao</span> holds Wilderness First Responder license <span className="font-mono text-[#141d1e] font-bold">#WFR-9912</span>.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-[#b9eadb] text-[#39675b] font-mono text-[11px] font-bold whitespace-nowrap">
                    Verified OK
                  </span>
                </div>

                {/* Item 3 */}
                <div className="p-3.5 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-[#39675b] font-bold text-sm mt-0.5">✓</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#141d1e]">3. Satellite SOS Device</span>
                        <span className="px-2 py-0.2 rounded bg-[#e0eaeb] text-[#141d1e] font-mono text-[10px] font-bold">
                          IMEI Registered
                        </span>
                      </div>
                      <p className="text-xs text-[#59413a] mt-0.5">
                        Garmin inReach Explorer+ IMEI <span className="font-mono text-[#141d1e] font-bold">30043406-8812</span> test beacon responded successfully at 06:15 AM today.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-[#b9eadb] text-[#39675b] font-mono text-[11px] font-bold whitespace-nowrap">
                    Live Synced
                  </span>
                </div>

                {/* Item 4 */}
                <div className="p-3.5 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-[#39675b] font-bold text-sm mt-0.5">✓</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#141d1e]">4. Weather &amp; Emergency Exit Plan</span>
                        <span className="px-2 py-0.2 rounded bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
                          Route Clear
                        </span>
                      </div>
                      <p className="text-xs text-[#59413a] mt-0.5">
                        Evacuation trail leads down to Tram Ton Station (Point 2,200m). Off-grid rescue vehicle contact is on file.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-[#b9eadb] text-[#39675b] font-mono text-[11px] font-bold whitespace-nowrap">
                    Plan Mapped
                  </span>
                </div>

                {/* Item 5 */}
                <div className="p-3.5 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-[#39675b] font-bold text-sm mt-0.5">✓</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#141d1e]">5. Fair Pricing &amp; Escrow Agreement</span>
                        <span className="px-2 py-0.2 rounded bg-[#bceddd] text-[#00201a] font-mono text-[10px] font-bold">
                          10% Platform Fee
                        </span>
                      </div>
                      <p className="text-xs text-[#59413a] mt-0.5">
                        Partner agreed to SummitTrails 72-hour escrow release following safe trip completion. Porter fair wage confirmed.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-[#b9eadb] text-[#39675b] font-mono text-[11px] font-bold whitespace-nowrap">
                    Terms Signed
                  </span>
                </div>
              </div>
            </div>

            {/* Tour Photos & Route Map */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbe4e5] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e6f0f1]">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#c2410c]/15 text-[#c2410c] flex items-center justify-center font-bold text-sm">
                    📷
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-[#141d1e]">Submitted Photos &amp; Route Map</h2>
                    <p className="text-xs text-[#59413a]">Check image quality, original rights, and trail truthfulness.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Photos Approved', 'All 3 media assets marked verified.')}
                  className="px-3 py-1 rounded bg-[#ecf5f6] hover:bg-[#e0eaeb] text-[#141d1e] text-xs font-bold transition-colors border border-[#dbe4e5] cursor-pointer"
                >
                  Approve All Photos
                </button>
              </div>

              {/* 3 Photos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative group rounded-xl overflow-hidden bg-[#ecf5f6] shadow-xs border border-[#dbe4e5]">
                  <img
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    alt="Day 1 Ridge Trail"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaJKrxFKPSw9gSlqtUM8eW4KmseDu26Qtel-oR13wyH2LQ24RqjFWXLkepBAnBbpT7z3atmb53YGUS-OKli2GUoWNNDqV4MtFLL1uGi1obGXrYQEDk_xXzcwpwKanQ9MCUShAYf_w-hbLrilebx_MsWgcl3iuVLBSvF6NzcvLNgsHKt1rvNL6WvX9WmzcAUCz-XGioIwAJu16IhiOcAw_lbwqUHqXeixMlv2HJGhyU8OV3DXzOBsQ"
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/75 backdrop-blur-xs px-2 py-1 rounded text-white font-mono text-[10px]">
                    <span>Day 1 Ridge Trail</span>
                    <span className="text-[#a0d0c2]">✓</span>
                  </div>
                </div>

                <div className="relative group rounded-xl overflow-hidden bg-[#ecf5f6] shadow-xs border border-[#dbe4e5]">
                  <img
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    alt="Camp at 2,800m"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIIXbbufhrFdCTVP4aDIMd7sYeCWmtGc2KzpsnfCON_wDWDJiEKC_VZRC19MGM2eH7G911Z_UPZ_BzCHmy9xCZ0HQC7noAxePa2L3GbUofB6VDChBlKxn-nHJy9a-0hdj2bkMEKKGveaPnUP8fNBrl4NBndW7Y5VHWGd9qlpiSlztFvI3KRyn7ia_tRBl_b569jitzNVGtPkMyPDy_eZKcd4C5owx6jpQ1lybMbSiWuiYJWDazQ_Q"
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/75 backdrop-blur-xs px-2 py-1 rounded text-white font-mono text-[10px]">
                    <span>Camp at 2,800m</span>
                    <span className="text-[#a0d0c2]">✓</span>
                  </div>
                </div>

                <div className="relative group rounded-xl overflow-hidden bg-[#ecf5f6] shadow-xs border border-[#dbe4e5]">
                  <img
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    alt="Summit Marker 3,143m"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGhiSH6gUSNzE8w0fg00fn61RNWZLjX3MZ6pCYFWd6xaCN78lFvVYBkscYws50baaTIOWCFcM0WMRabfgJhxHZcpGh_RIywWirdDfLgQv5W3A4vV8A8VtrhDupRZOQMGp3LFzVlhtpQmgqYldseQGbOgmNJcATqBk9ToiB2AngmyYi-U1ZHk0K-1L-My3Ky_ecBYUCPFFwPElcOEEjOjbgK2_9W2Kc6FurAopXWCFdoIJcVims7yE"
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/75 backdrop-blur-xs px-2 py-1 rounded text-white font-mono text-[10px]">
                    <span>Summit Marker 3,143m</span>
                    <span className="text-[#a0d0c2]">✓</span>
                  </div>
                </div>
              </div>

              {/* Itinerary Review */}
              <div className="pt-2 space-y-2">
                <h3 className="text-xs font-bold text-[#141d1e]">Itinerary Review (Plain English)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#9b2f00] font-bold uppercase">Day 1</span>
                      <span className="font-mono text-[10px] text-[#59413a]">6.5 km</span>
                    </div>
                    <div className="text-xs font-bold text-[#141d1e]">Base Camp Climb</div>
                    <p className="text-[11px] text-[#59413a] leading-relaxed">
                      Depart Tram Ton pass at 1,900m. Walk through bamboo forest to Forest Camp 2,200m. Hot dinner prepared by local cooks.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#9b2f00] font-bold uppercase">Day 2</span>
                      <span className="font-mono text-[10px] text-[#59413a]">5.2 km</span>
                    </div>
                    <div className="text-xs font-bold text-[#141d1e]">Summit &amp; Cloud Ridge</div>
                    <p className="text-[11px] text-[#59413a] leading-relaxed">
                      Early 4:00 AM start. Push to Fansipan peak (3,143m) for sunrise above the clouds. Return to high camp for hot tea and rest.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#9b2f00] font-bold uppercase">Day 3</span>
                      <span className="font-mono text-[10px] text-[#59413a]">7.8 km</span>
                    </div>
                    <div className="text-xs font-bold text-[#141d1e]">Descent &amp; Farewell</div>
                    <p className="text-[11px] text-[#59413a] leading-relaxed">
                      Walk downhill past Sin Chai waterfall. Return transfer to Sapa town center by 2:00 PM. Check-out and porter tips.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified Gear */}
              <div className="p-3 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5]">
                <div className="text-[10px] font-bold text-[#141d1e] uppercase tracking-wider mb-2">
                  Verified Partner Equipment Included
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded bg-white text-[#141d1e] font-semibold border border-[#dbe4e5] flex items-center gap-1">
                    <span className="text-[#39675b]">✓</span> 4-Season Mountain Tents
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white text-[#141d1e] font-semibold border border-[#dbe4e5] flex items-center gap-1">
                    <span className="text-[#39675b]">✓</span> -5°C Down Sleeping Bags
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white text-[#141d1e] font-semibold border border-[#dbe4e5] flex items-center gap-1">
                    <span className="text-[#39675b]">✓</span> SteriPEN Water Purifiers
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white text-[#141d1e] font-semibold border border-[#dbe4e5] flex items-center gap-1">
                    <span className="text-[#39675b]">✓</span> Emergency Oxygen Bottle
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white text-[#141d1e] font-semibold border border-[#dbe4e5] flex items-center gap-1">
                    <span className="text-[#39675b]">✓</span> Trekking Poles for every guest
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Review Decision & Notes Box */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbe4e5] space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#e6f0f1]">
                <span className="w-8 h-8 rounded-lg bg-[#ecf5f6] text-[#141d1e] flex items-center justify-center font-bold text-sm">
                  ✍
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#141d1e]">Staff Review Note to Partner</h2>
                  <p className="text-xs text-[#59413a]">This note will appear in the partner portal and email alert.</p>
                </div>
              </div>

              {/* Quick Feedback Tag Buttons */}
              <div>
                <div className="font-mono text-[10px] text-[#59413a] uppercase font-bold mb-1.5">
                  Quick Feedback Shortcuts
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleInsertTag('Please confirm backup guide name and phone number.')}
                    className="px-2.5 py-1 rounded bg-[#ecf5f6] hover:bg-[#e0eaeb] text-[#141d1e] text-xs transition-colors border border-[#dbe4e5] cursor-pointer"
                  >
                    + Missing Backup Guide Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('Please verify sleeping tent brand and season rating.')}
                    className="px-2.5 py-1 rounded bg-[#ecf5f6] hover:bg-[#e0eaeb] text-[#141d1e] text-xs transition-colors border border-[#dbe4e5] cursor-pointer"
                  >
                    + Clarify Tent Brand
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('Please upload a clear high-resolution summit photo.')}
                    className="px-2.5 py-1 rounded bg-[#ecf5f6] hover:bg-[#e0eaeb] text-[#141d1e] text-xs transition-colors border border-[#dbe4e5] cursor-pointer"
                  >
                    + Photo Resolution Issue
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('Guide license is valid and all safety criteria are satisfied. Approved.')}
                    className="px-2.5 py-1 rounded bg-[#ecf5f6] hover:bg-[#e0eaeb] text-[#141d1e] text-xs transition-colors border border-[#dbe4e5] cursor-pointer font-semibold text-[#39675b]"
                  >
                    + All Checks Pass (Good to go)
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  className="w-full bg-[#ecf5f6] text-[#141d1e] p-3 rounded-xl text-xs sm:text-sm border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c] leading-relaxed"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Final Decision Bottom Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#e6f0f1]">
                <div className="flex items-center gap-1.5 text-[#59413a] font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#39675b]"></span>
                  <span>Reviewer: K. Vance (Quality Officer #04)</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleDecision('Denied')}
                    className="px-3.5 py-2 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold hover:bg-[#ffb4ab] transition-colors cursor-pointer"
                  >
                    ✕ Deny Tour
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision('Changes Requested')}
                    className="px-4 py-2 rounded-lg bg-[#ffdbd0] text-[#6e3900] text-xs font-bold hover:bg-[#ffb59d] transition-colors shadow-xs cursor-pointer"
                  >
                    Ask Partner for Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision('Approved & Published')}
                    className="px-5 py-2.5 rounded-lg bg-[#39675b] text-white text-xs font-bold hover:bg-[#204f44] transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✓</span> Accept &amp; Publish Tour
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl border text-white animate-fade-in flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-[#141d1e] border-[#39675b]'
              : toast.type === 'warning'
              ? 'bg-[#291700] border-[#c2410c]'
              : 'bg-[#3b0808] border-[#ba1a1a]'
          }`}
        >
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-[#39675b] text-white'
                : toast.type === 'warning'
                ? 'bg-[#c2410c] text-white'
                : 'bg-[#ba1a1a] text-white'
            }`}
          >
            {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '✉' : '✕'}
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

export default AdminDashboardPage;
