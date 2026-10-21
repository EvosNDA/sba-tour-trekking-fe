import React, { useState } from 'react';
import { ScreenId } from '../../../types/expedition';

export interface PartnerFinalReviewPageProps {
  onNavigate?: (screen: ScreenId) => void;
}

export const PartnerFinalReviewPage: React.FC<PartnerFinalReviewPageProps> = ({
  onNavigate = () => {},
}) => {
  const [legalConfirmed, setLegalConfirmed] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

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
    }, 5000);
  };

  const handleSignAndSubmit = () => {
    if (!legalConfirmed) {
      showToast('Confirmation Required', 'Please check the legal confirmation box to verify your credentials.');
      return;
    }

    showToast(
      'Not submitted to server',
      'Partner applications are reviewed by the operations team offline. This frontend does not submit partner contracts.',
    );
  };

  return (
    <div className="w-full bg-[#f2fbfc] text-[#141d1e] min-h-screen font-sans">
      {/* Top Navigation & Context Bar */}
      <div className="w-full bg-[#ecf5f6] py-4 border-b border-[#dbe4e5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs text-[#39675b] uppercase tracking-wider font-semibold">
              Verified Partner Onboarding
            </span>
            <span className="text-[#8d7168] font-mono text-xs">•</span>
            <span className="font-mono text-xs font-semibold text-[#141d1e] bg-[#e6f0f1] px-2 py-0.5 rounded">
              Ref: #ST-VN-8842
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#39675b] bg-[#b9eadb] px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39675b] animate-pulse"></span>
              Auto-saved just now
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#59413a] uppercase tracking-wider">
              Application Status
            </span>
            <span className="font-mono text-xs font-bold text-[#9b2f00] bg-[#ffdbd0] px-2.5 py-0.5 rounded">
              Step 4 of 4
            </span>
          </div>
        </div>
      </div>

      {/* Stepper Header Section */}
      <div className="w-full bg-white py-8 shadow-xs border-b border-[#dbe4e5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Step 1: Company Info */}
            <button
              type="button"
              onClick={() => onNavigate('partner_company_info')}
              className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ecf5f6] hover:bg-[#e0eaeb] transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#39675b] text-white flex items-center justify-center shrink-0 shadow-xs text-xs">
                ✓
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-[#39675b] uppercase tracking-wider">Step 01</p>
                <p className="text-xs font-semibold text-[#141d1e] truncate">Company Info</p>
              </div>
            </button>

            {/* Step 2: Certificates */}
            <button
              type="button"
              onClick={() => onNavigate('partner_certificates')}
              className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ecf5f6] hover:bg-[#e0eaeb] transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#39675b] text-white flex items-center justify-center shrink-0 shadow-xs text-xs">
                ✓
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-[#39675b] uppercase tracking-wider">Step 02</p>
                <p className="text-xs font-semibold text-[#141d1e] truncate">Certificates &amp; Safety</p>
              </div>
            </button>

            {/* Step 3: Bank Payouts */}
            <button
              type="button"
              onClick={() => onNavigate('partner_bank_payouts')}
              className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ecf5f6] hover:bg-[#e0eaeb] transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#39675b] text-white flex items-center justify-center shrink-0 shadow-xs text-xs">
                ✓
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-[#39675b] uppercase tracking-wider">Step 03</p>
                <p className="text-xs font-semibold text-[#141d1e] truncate">Bank Payouts</p>
              </div>
            </button>

            {/* Step 4: Final Review (Active) */}
            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-[#c2410c] text-white shadow-md">
              <div className="w-8 h-8 rounded-full bg-white text-[#c2410c] flex items-center justify-center shrink-0 font-mono text-xs font-bold shadow-xs">
                04
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wider opacity-90">Current Step</p>
                <p className="text-xs font-bold truncate">Final Review &amp; Sign</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Title Banner */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-10 pb-6 w-full">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 self-start bg-[#b9eadb] text-[#1f4e43] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-[#b9eadb]">
            <span>✓</span> Official Outfitter Partner Review
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#141d1e] leading-tight tracking-tight">
            Review Application &amp; Sign Partner Agreement
          </h1>
          <p className="text-base text-[#59413a] max-w-3xl leading-relaxed">
            Double check your company details, safety documents, and bank payout settings before sending your outfitter contract for safety desk verification.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Summary Cards & Signature Flow (~66%) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Card 1: Company & Trekking Region Summary */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#dbe4e5] relative overflow-hidden">
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-[#e6f0f1]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ecf5f6] flex items-center justify-center text-[#39675b] text-lg font-bold">
                    🏢
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#141d1e]">
                      Company &amp; Trekking Region Summary
                    </h2>
                    <p className="text-xs text-[#59413a]">Step 1 core registry &amp; operational base</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('partner_company_info')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#9b2f00] hover:text-[#c2410c] transition-colors bg-[#ecf5f6] px-3 py-1.5 rounded-lg border border-[#dbe4e5] cursor-pointer"
                >
                  Edit Step 1
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#59413a]">
                    Registered Business Name
                  </span>
                  <p className="text-sm font-semibold text-[#141d1e]">Sapa Peak Expeditions Co.</p>
                  <p className="font-mono text-xs text-[#39675b] bg-[#ecf5f6] inline-block px-2 py-0.5 rounded mt-1 border border-[#dbe4e5]">
                    Tax ID: VNM-TREK-8849-01
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#59413a]">
                    Lead Expedition Director
                  </span>
                  <p className="text-sm font-semibold text-[#141d1e]">Huu Minh Vu</p>
                  <p className="text-xs text-[#59413a]">minh@sapapeaks.com • +84 912 345 678</p>
                </div>
              </div>
              <div className="bg-[#ecf5f6] rounded-lg p-4 space-y-3 border border-[#dbe4e5]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#59413a]">
                    Authorized Trekking Sectors
                  </span>
                  <span className="text-[11px] text-[#39675b] font-bold flex items-center gap-1">
                    <span>✓</span> Information Verified
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-white text-[#141d1e] px-3 py-1.5 rounded shadow-xs border border-[#dbe4e5]">
                    <span className="text-[#9b2f00]">⛰</span> Fansipan &amp; Hoang Lien Son (Peak 3,143m)
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-white text-[#141d1e] px-3 py-1.5 rounded shadow-xs border border-[#dbe4e5]">
                    <span className="text-[#9b2f00]">🥾</span> Ha Giang Karst Geopark Circuit
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Verified Safety Certificates & Licensure */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#dbe4e5] relative overflow-hidden">
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-[#e6f0f1]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ecf5f6] flex items-center justify-center text-[#39675b] text-lg font-bold">
                    🎖
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#141d1e]">
                      Verified Safety Certificates &amp; Licensure
                    </h2>
                    <p className="text-xs text-[#59413a]">Step 2 safety audits, alpine credentials &amp; park permits</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('partner_certificates')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#9b2f00] hover:text-[#c2410c] transition-colors bg-[#ecf5f6] px-3 py-1.5 rounded-lg border border-[#dbe4e5] cursor-pointer"
                >
                  Edit Step 2
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Item 1 */}
                <div className="p-4 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-white text-[#39675b] flex items-center justify-center shrink-0 shadow-xs text-xs font-bold mt-0.5">
                    📄
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#141d1e] truncate">license_vn_2024.pdf</p>
                    <p className="font-mono text-[11px] text-[#59413a]">2.4 MB • Official VN Tour Operator</p>
                    <p className="text-[11px] text-[#39675b] font-bold mt-1">Status: Verified &amp; Approved</p>
                  </div>
                </div>
                {/* Item 2 */}
                <div className="p-4 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-white text-[#39675b] flex items-center justify-center shrink-0 shadow-xs text-xs font-bold mt-0.5">
                    🩺
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#141d1e]">Lead Guides Roster</p>
                    <p className="text-[11px] text-[#59413a]">4 Certified Wilderness First Aid (WFA)</p>
                    <p className="text-[11px] text-[#39675b] font-bold mt-1">Credentials Checked</p>
                  </div>
                </div>
                {/* Item 3 */}
                <div className="p-4 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-white text-[#39675b] flex items-center justify-center shrink-0 shadow-xs text-xs font-bold mt-0.5">
                    📡
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#141d1e]">Satellite Distress Beacons</p>
                    <p className="text-[11px] text-[#59413a]">Garmin inReach Explorer GPS</p>
                    <p className="font-mono text-[11px] text-[#59413a] mt-1">2 Active IMEIs Synced</p>
                  </div>
                </div>
                {/* Item 4 */}
                <div className="p-4 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-white text-[#39675b] flex items-center justify-center shrink-0 shadow-xs text-xs font-bold mt-0.5">
                    🌲
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#141d1e]">National Park Permit</p>
                    <p className="text-[11px] text-[#59413a]">Hoang Lien Concession Agreement</p>
                    <p className="text-[11px] text-[#39675b] font-bold mt-1">Valid through Dec 2025</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Weekly Payout & Invoicing Setup */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#dbe4e5] relative overflow-hidden">
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-[#e6f0f1]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ecf5f6] flex items-center justify-center text-[#39675b] text-lg font-bold">
                    🏦
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#141d1e]">
                      Weekly Payout &amp; Invoicing Setup
                    </h2>
                    <p className="text-xs text-[#59413a]">Step 3 automated settlement &amp; electronic VAT registry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('partner_bank_payouts')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#9b2f00] hover:text-[#c2410c] transition-colors bg-[#ecf5f6] px-3 py-1.5 rounded-lg border border-[#dbe4e5] cursor-pointer"
                >
                  Edit Step 3
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5]">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#59413a]">
                      Bank &amp; Branch
                    </span>
                    <p className="text-xs font-bold text-[#141d1e]">Vietcombank</p>
                    <p className="text-[11px] text-[#59413a]">Lao Cai Provincial Branch</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#59413a]">
                      Account Name
                    </span>
                    <p className="text-xs font-bold text-[#141d1e] leading-snug">
                      Sapa Peak Expeditions Co. Ltd
                    </p>
                    <span className="font-mono text-[10px] text-[#39675b] bg-white px-2 py-0.5 rounded border border-[#dbe4e5]">
                      Matches Legal Tax Entity
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#59413a]">
                      Account Number &amp; Currency
                    </span>
                    <p className="font-mono text-xs font-bold text-[#141d1e]">0071 0008 8129 4421</p>
                    <p className="font-mono text-xs text-[#9b2f00] font-semibold">VND (Vietnam Dong)</p>
                  </div>
                </div>

                {/* Escrow callout */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#e6f0f1] border border-[#dbe4e5]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center shrink-0 font-bold text-xs">
                      ⏱
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#141d1e]">
                        Settlement Frequency: Every Monday at 10:00 AM ICT
                      </p>
                      <p className="text-[11px] text-[#59413a]">
                        72-hour post-trek safety holding period applies • Fixed 10% platform fee
                      </p>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <span className="font-mono text-[11px] bg-white text-[#141d1e] px-2.5 py-1 rounded inline-flex items-center gap-1 border border-[#dbe4e5]">
                      <span>🧾</span> e-VAT Circular 78 Active
                    </span>
                    <p className="text-[11px] text-[#59413a] mt-0.5">billing@sapapeaks.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Master Partner Agreement & Digital Signature */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-md border border-[#dbe4e5] relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e6f0f1]">
                <div className="w-10 h-10 rounded-lg bg-[#c2410c] text-white flex items-center justify-center shadow-xs text-lg font-bold">
                  ✍
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#141d1e]">
                    Master Partner Agreement &amp; Digital Sign-Off
                  </h2>
                  <p className="text-xs text-[#59413a]">
                    SummitTrails Commercial Outfitter Terms v4.8
                  </p>
                </div>
              </div>

              {/* Plain Terms Box */}
              <div className="bg-[#ecf5f6] rounded-lg p-5 mb-6 space-y-4 border border-[#dbe4e5]">
                <h3 className="font-serif text-lg text-[#141d1e] font-semibold">
                  Plain Terms Summary (Key Clauses)
                </h3>
                <div className="space-y-3 text-xs text-[#59413a] leading-relaxed">
                  <div className="flex items-start gap-3">
                    <span className="text-[#39675b] font-bold text-base mt-0.5">🛡</span>
                    <p>
                      <strong className="text-[#141d1e]">72-Hour Climber Safety Window:</strong> SummitTrails holds client booking deposits in protected escrow until 72 hours after trek completion. Funds release automatically unless a severe distress beacon or incident claim is filed.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#39675b] font-bold text-base mt-0.5">💳</span>
                    <p>
                      <strong className="text-[#141d1e]">Zero Hidden Booking Fees:</strong> Sapa Peak Expeditions retains 90% of gross tour pricing. SummitTrails covers credit card processing, 24/7 rescue hotline dispatch, and international guest insurance triage.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#39675b] font-bold text-base mt-0.5">🌿</span>
                    <p>
                      <strong className="text-[#141d1e]">Responsible Mountain Stewardship:</strong> Outfitter certifies that all guided parties practice strict Leave No Trace (LNT) Class-I outdoor ethics and carry back all waste from Hoang Lien National Park and alpine trails.
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Confirmation Checkbox */}
              <div className="mb-8 p-4 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex items-start gap-3">
                <input
                  checked={legalConfirmed}
                  onChange={(e) => setLegalConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-[#9b2f00] cursor-pointer"
                  id="legal-confirm"
                  type="checkbox"
                />
                <label
                  className="text-xs text-[#141d1e] cursor-pointer select-none leading-normal font-medium"
                  htmlFor="legal-confirm"
                >
                  I hereby confirm that all submitted business licenses, guide certifications, and Vietcombank account details are genuine, accurate, and authorized under Vietnam Tourism Law No. 09/2017/QH14.
                </label>
              </div>

              {/* Digital Signature Block */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#59413a]">
                  Authorized Signatory Declaration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#59413a]">
                      Full Legal Signatory Name
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] text-xs font-semibold px-4 py-2.5 rounded-lg border border-[#dbe4e5]"
                        readOnly
                        type="text"
                        value="Huu Minh Vu"
                      />
                      <span className="absolute right-3 top-2.5 text-[#39675b] text-sm font-bold">
                        ✓
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#59413a]">
                      Corporate Title / Position
                    </label>
                    <input
                      className="w-full bg-[#ecf5f6] text-[#141d1e] text-xs font-semibold px-4 py-2.5 rounded-lg border border-[#dbe4e5]"
                      readOnly
                      type="text"
                      value="Founder & Lead Expedition Director"
                    />
                  </div>
                </div>

                {/* Stylized Signature Pad & Date Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="md:col-span-2 p-5 bg-[#ecf5f6] border border-[#dbe4e5] rounded-lg flex flex-col justify-between min-h-[120px]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#59413a] uppercase">
                        Digital Signature Preview
                      </span>
                      <span className="font-mono text-[10px] text-[#39675b] bg-white px-2 py-0.5 rounded border border-[#dbe4e5]">
                        SHA-256 e-Sign
                      </span>
                    </div>
                    <div className="py-2 px-2">
                      <p className="text-3xl text-[#9b2f00] italic font-serif tracking-wide select-none">
                        Huu Minh Vu
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[#59413a] font-mono text-[10px]">
                      <span>Signatory IP: 118.69.182.204 (Hanoi, VN)</span>
                      <span className="font-bold text-[#39675b]">Digitally Recorded</span>
                    </div>
                  </div>

                  <div className="p-5 bg-[#ecf5f6] border border-[#dbe4e5] rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#59413a]">
                        Signing Date
                      </span>
                      <p className="text-sm text-[#141d1e] mt-1 font-bold">November 18, 2026</p>
                      <p className="font-mono text-xs text-[#39675b] mt-0.5">14:32:08 UTC+7</p>
                    </div>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#141d1e] bg-[#b9eadb] px-2 py-1 rounded">
                        <span>🔒</span> Encrypted Vault
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Actions Bar */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-[#dbe4e5] flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => onNavigate('partner_bank_payouts')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold text-[#59413a] hover:text-[#141d1e] bg-[#ecf5f6] hover:bg-[#e0eaeb] px-5 py-3 rounded-lg transition-all border border-[#dbe4e5] cursor-pointer"
              >
                <span>← Back to Step 3 (Bank Payouts)</span>
              </button>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => showToast('Draft Saved', 'Full application progress stored.')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#59413a] hover:text-[#141d1e] bg-[#ecf5f6] hover:bg-[#e0eaeb] px-4 py-3 rounded-lg transition-all border border-[#dbe4e5] cursor-pointer"
                >
                  <span>Save Draft</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignAndSubmit}
                  disabled={isSigning}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs px-6 py-3 rounded-lg shadow-md transition-all font-bold cursor-pointer ${
                    isSigned
                      ? 'bg-[#39675b] text-white'
                      : 'bg-[#c2410c] hover:bg-[#9b2f00] text-white active:scale-95'
                  }`}
                >
                  {isSigning ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Cryptographically Signing...</span>
                    </>
                  ) : isSigned ? (
                    <>
                      <span>✓</span>
                      <span>Application Submitted!</span>
                    </>
                  ) : (
                    <>
                      <span>✍</span>
                      <span>Sign &amp; Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column Sidebar (~34%) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Timeline */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbe4e5]">
              <div className="flex items-center gap-2.5 mb-5 text-[#9b2f00]">
                <span className="text-lg">🗺</span>
                <h3 className="text-sm font-bold text-[#141d1e]">What Happens Next?</h3>
              </div>
              <div className="space-y-5 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[#e6f0f1]">
                <div className="relative flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#c2410c] text-white flex items-center justify-center font-mono text-xs flex-shrink-0 z-10 shadow-xs font-bold">
                    A
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141d1e]">Safety Desk Review</p>
                    <p className="text-[11px] text-[#59413a] leading-relaxed">
                      Within 24–48 hours, our alpine audit team verifies national park permits and guide licenses.
                    </p>
                  </div>
                </div>
                <div className="relative flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#ecf5f6] text-[#141d1e] flex items-center justify-center font-mono text-xs flex-shrink-0 z-10 shadow-xs border border-[#dbe4e5] font-bold">
                    B
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141d1e]">Automated Test Wire (10,000 VND)</p>
                    <p className="text-[11px] text-[#59413a] leading-relaxed">
                      We send a minor micro-transfer to verify your Vietcombank domestic account routing.
                    </p>
                  </div>
                </div>
                <div className="relative flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#ecf5f6] text-[#141d1e] flex items-center justify-center font-mono text-xs flex-shrink-0 z-10 shadow-xs border border-[#dbe4e5] font-bold">
                    C
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141d1e]">Dispatch Orientation Call</p>
                    <p className="text-[11px] text-[#59413a] leading-relaxed">
                      A quick 15-minute onboarding briefing with your regional guide coordinator.
                    </p>
                  </div>
                </div>
                <div className="relative flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#ecf5f6] text-[#141d1e] flex items-center justify-center font-mono text-xs flex-shrink-0 z-10 shadow-xs border border-[#dbe4e5] font-bold">
                    D
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#141d1e]">Publish Tours &amp; Take Bookings</p>
                    <p className="text-[11px] text-[#59413a] leading-relaxed">
                      Your operator profile goes live across SummitTrails marketplace worldwide.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mai Nguyen contact */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbe4e5]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#59413a]">
                  Your Dedicated Partner Manager
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#39675b] bg-[#b9eadb] px-2 py-0.5 rounded font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39675b]"></span> Online
                </span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border border-[#dbe4e5]">
                  <img
                    className="w-full h-full object-cover"
                    alt="Mai Nguyen portrait"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnP7xlFKn93XeDPv0JIgjEw0bGx6nGww3PSGNgwcQrEjYEw9kcxYBrn0YuAAUaDeKSV9imF4rqdop1L0QkPszRcHwc1e7L0p-zcPjcwmck8f22htO46qWLusS5ltWKRZjmOU_t1oEnBlZo0ej90e2M82tE1owV3MyAeYWTRJ-HqcE2k0VnTVlGY0GGwLPRLY3rm1f562L8x2AcdZ1s_zQQO_nrSiUq7MsnpgUSnoLreRcbVx3k7kk"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#141d1e]">Mai Nguyen</p>
                  <p className="text-[11px] text-[#59413a]">Head of Vietnam Guide Relations</p>
                  <p className="font-mono text-[10px] text-[#39675b]">Hanoi Backcountry Dispatch</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-[#e6f0f1]">
                <a
                  className="flex items-center gap-2 text-[#141d1e] hover:text-[#9b2f00] transition-colors text-xs font-semibold"
                  href="tel:+842439428888"
                >
                  <span className="text-[#9b2f00]">📞</span>
                  <span>+84 24 3942 8888</span>
                </a>
                <p className="text-xs text-[#59413a] bg-[#ecf5f6] p-3 rounded-lg leading-snug border border-[#dbe4e5]">
                  "We speak English &amp; Tiếng Việt. Need assistance matching your Hoang Lien park permit or setting up automated e-invoices?"
                </p>
              </div>
            </div>

            {/* Quick jump to Ops Console */}
            <div className="p-4 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] space-y-2">
              <span className="text-[11px] font-bold text-[#39675b] uppercase tracking-wider block">
                Quality Officer Simulation
              </span>
              <p className="text-xs text-[#59413a]">
                View how SummitTrails operations team inspects and moderates tour submissions:
              </p>
              <button
                type="button"
                onClick={() => onNavigate('ops_moderation')}
                className="w-full py-2 px-3 bg-[#39675b] hover:bg-[#204f44] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
              >
                Open Ops Moderation Console →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141d1e] text-white px-5 py-3.5 rounded-xl shadow-xl border border-white/20 animate-fade-in flex items-center gap-3">
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

export default PartnerFinalReviewPage;
