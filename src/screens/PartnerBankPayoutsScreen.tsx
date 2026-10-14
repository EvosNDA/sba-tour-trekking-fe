import React, { useState } from 'react';
import { ScreenId } from '../types/expedition';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const PartnerBankPayoutsScreen: React.FC<Props> = ({ onNavigate }) => {
  const [bankName, setBankName] = useState('Vietcombank (Foreign Trade)');
  const [branchName, setBranchName] = useState('Lao Cai Branch - Sapa District');
  const [accountNumber, setAccountNumber] = useState('0071 0008 8129 4421');
  const [taxCode, setTaxCode] = useState('0108924155');
  const [invoicingEmail, setInvoicingEmail] = useState('billing@sapapeaks.com');
  const [eInvoiceAuth, setEInvoiceAuth] = useState(true);

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

  const handleContinue = () => {
    showToast('Bank Routing Saved', 'Moving to Step 4: Final Review & Sign-off.');
    setTimeout(() => {
      onNavigate('partner_final_review');
    }, 800);
  };

  return (
    <div className="w-full bg-[#f2fbfc] text-[#141d1e] min-h-screen font-sans">
      {/* Top Visual Accent / Breadcrumb Bar */}
      <div className="w-full bg-[#ecf5f6] py-3 border-b border-[#dbe4e5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-xs text-[#59413a]">
            <span className="inline-flex items-center gap-1.5 text-[#39675b] font-semibold">
              <span>✓</span> Verified Partner Onboarding
            </span>
            <span>/</span>
            <span className="text-[#141d1e] font-semibold">Application Ref: #ST-VN-8842</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#b9eadb] text-[#3d6b5f] text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#39675b] animate-pulse"></span>
              Auto-saved just now
            </span>
            <span className="font-mono text-xs text-[#59413a]">Step 3 of 4</span>
          </div>
        </div>
      </div>

      {/* Stepper Header Container */}
      <div className="w-full bg-white shadow-xs border-b border-[#dbe4e5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Step 1 Completed */}
            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ecf5f6]">
              <div className="w-8 h-8 rounded-full bg-[#39675b] text-white flex items-center justify-center shrink-0 shadow-xs text-xs">
                ✓
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[#39675b] uppercase tracking-wider">
                  Step 1 • Completed
                </span>
                <span className="text-sm font-semibold text-[#141d1e] truncate">
                  Company Info
                </span>
              </div>
            </div>

            {/* Step 2 Completed */}
            <button
              type="button"
              onClick={() => onNavigate('partner_certificates')}
              className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ecf5f6] hover:bg-[#e0eaeb] transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#39675b] text-white flex items-center justify-center shrink-0 shadow-xs text-xs">
                ✓
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[#39675b] uppercase tracking-wider">
                  Step 2 • Completed
                </span>
                <span className="text-sm font-semibold text-[#141d1e] truncate">
                  Certificates
                </span>
              </div>
            </button>

            {/* Step 3 Active */}
            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ffdbd0] shadow-xs border border-[#ffb59d]">
              <div className="w-8 h-8 rounded-full bg-[#c2410c] text-white flex items-center justify-center shrink-0 shadow-xs text-xs font-bold">
                3
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[#9b2f00] uppercase tracking-wider">
                  In Progress
                </span>
                <span className="text-sm font-bold text-[#390c00] truncate">
                  Bank Payouts
                </span>
              </div>
            </div>

            {/* Step 4 Pending */}
            <button
              type="button"
              onClick={() => onNavigate('partner_final_review')}
              className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ecf5f6]/60 opacity-70 hover:opacity-100 transition-opacity text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#d2dcdd] text-[#59413a] flex items-center justify-center shrink-0 text-xs font-bold">
                4
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[#59413a] uppercase tracking-wider">
                  Step 4
                </span>
                <span className="text-sm text-[#141d1e] truncate">Final Review</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Work Canvas */}
      <div className="w-full bg-[#f2fbfc] pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Top Section Titles */}
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#bceddd] text-[#00201a] text-xs font-bold mb-4">
              <span>🏛</span> Official Outfitter Banking Setup
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#141d1e] mb-3 leading-tight">
              Set Up Your Weekly Bank Payouts
            </h1>
            <p className="text-base text-[#59413a] leading-relaxed">
              Enter your company bank account details to get automated earnings sent every Monday after the 72-hour safety check. Direct wire with zero transfer fees.
            </p>
          </div>

          {/* Two-Column Primary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Form & Sections (~68%) */}
            <div className="lg:col-span-8 space-y-10">
              {/* Section 01: Bank Account Details */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-[#dbe4e5] space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#e6f0f1]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#c2410c]/10 text-[#c2410c] flex items-center justify-center font-mono text-xs font-bold">
                      01
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#141d1e]">
                        Receiving Bank Account Details
                      </h2>
                      <p className="text-xs text-[#59413a]">
                        Where SummitTrails transfers your trek booking revenue.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#b9eadb] text-[#3d6b5f] font-mono text-xs font-semibold">
                    <span>🔒</span> 256-Bit Encrypted
                  </span>
                </div>

                {/* Form Grid */}
                <div className="space-y-5">
                  {/* Beneficiary Name */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Beneficiary / Account Holder Name
                      </label>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-[#9b2f00]">
                        <span>🔒</span> Must match registered business name
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-3 rounded-lg text-sm font-medium border border-[#dbe4e5] cursor-not-allowed focus:outline-none"
                        readOnly
                        type="text"
                        value="Sapa Peak Expeditions Company Limited"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#39675b] flex items-center gap-1 text-xs font-bold">
                        <span>✓</span> Matched Step 1
                      </div>
                    </div>
                    <p className="text-xs text-[#59413a] mt-1.5">
                      Legal name imported from your validated Business Registration certificate.
                    </p>
                  </div>

                  {/* Bank Selector & Branch Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bank Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-[#141d1e] mb-2">
                        Bank Name
                      </label>
                      <div className="relative">
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full bg-white shadow-xs rounded-lg px-4 py-3 text-xs sm:text-sm font-semibold border border-[#dbe4e5] focus:outline-none focus:border-[#c2410c] cursor-pointer"
                        >
                          <option value="Vietcombank (Foreign Trade)">Vietcombank (Foreign Trade)</option>
                          <option value="BIDV (Bank for Investment & Development)">BIDV (Bank for Investment &amp; Development)</option>
                          <option value="VietinBank (Vietnam Joint Stock)">VietinBank (Vietnam Joint Stock)</option>
                          <option value="Techcombank (Vietnam Technological)">Techcombank (Vietnam Technological)</option>
                        </select>
                      </div>
                      <span className="font-mono text-[11px] text-[#59413a] block mt-1">
                        SWIFT: BFTVVNVX
                      </span>
                    </div>

                    {/* Branch & City */}
                    <div>
                      <label className="block text-xs font-bold text-[#141d1e] mb-2">
                        Branch Name &amp; District
                      </label>
                      <div className="relative">
                        <input
                          className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-3 rounded-lg text-xs sm:text-sm border border-[#dbe4e5] focus:bg-white focus:outline-none transition-colors"
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          type="text"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#59413a] text-sm">
                          📍
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[#59413a] block mt-1">
                        Northern Alpine Hub
                      </span>
                    </div>
                  </div>

                  {/* Account Number & Currency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Account Number */}
                    <div>
                      <label className="block text-xs font-bold text-[#141d1e] mb-2">
                        Bank Account Number
                      </label>
                      <div className="relative">
                        <input
                          className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-3 rounded-lg font-mono text-xs sm:text-sm font-semibold tracking-wider border border-[#dbe4e5] focus:bg-white focus:outline-none transition-colors"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          type="text"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#39675b] text-base font-bold">
                          ✓
                        </span>
                      </div>
                      <p className="text-xs text-[#59413a] mt-1.5">
                        Direct domestic clearing via NAPAS Fast Transfer.
                      </p>
                    </div>

                    {/* Currency Preference */}
                    <div>
                      <label className="block text-xs font-bold text-[#141d1e] mb-2">
                        Settlement Currency
                      </label>
                      <div className="p-3 rounded-lg bg-[#e0eaeb] border border-[#dbe4e5] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#c2410c] text-white flex items-center justify-center font-bold text-xs">
                            ₫
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#141d1e] block leading-tight">
                              VND - Vietnam Dong
                            </span>
                            <span className="font-mono text-[11px] text-[#39675b]">
                              Zero Foreign Exchange Fees
                            </span>
                          </div>
                        </div>
                        <span className="text-[#9b2f00] font-bold">●</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 02: Payout Schedule & Escrow Policy */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-[#dbe4e5] space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-[#e6f0f1]">
                  <div className="w-8 h-8 rounded bg-[#c2410c]/10 text-[#c2410c] flex items-center justify-center font-mono text-xs font-bold">
                    02
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#141d1e]">
                      Payout Schedule &amp; Escrow Policy
                    </h2>
                    <p className="text-xs text-[#59413a]">
                      Simple, predictable payouts designed for professional wilderness operations.
                    </p>
                  </div>
                </div>

                {/* 3-Step Flow Diagram */}
                <div className="bg-[#ecf5f6] rounded-xl p-6 space-y-5 border border-[#dbe4e5]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-xs space-y-2 border border-[#dbe4e5]">
                      <div className="w-8 h-8 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center text-sm font-bold">
                        💳
                      </div>
                      <h4 className="text-xs font-bold text-[#141d1e]">
                        1. Guest Books &amp; Pays
                      </h4>
                      <p className="text-[11px] text-[#59413a] leading-relaxed">
                        Guest deposits 100% of trek funds into SummitTrails secured escrow account.
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-xs space-y-2 border border-[#dbe4e5]">
                      <div className="w-8 h-8 rounded-full bg-[#ffdbd0] text-[#9b2f00] flex items-center justify-center text-sm font-bold">
                        🛡
                      </div>
                      <h4 className="text-xs font-bold text-[#141d1e]">
                        2. 72-Hour Safety Check
                      </h4>
                      <p className="text-[11px] text-[#59413a] leading-relaxed">
                        Trek ends safely. Dispatch confirms zero distress triggers or unhandled emergencies.
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-xs space-y-2 border border-[#dbe4e5]">
                      <div className="w-8 h-8 rounded-full bg-[#39675b] text-white flex items-center justify-center text-sm font-bold">
                        🏦
                      </div>
                      <h4 className="text-xs font-bold text-[#141d1e]">
                        3. Weekly Monday Payout
                      </h4>
                      <p className="text-[11px] text-[#59413a] leading-relaxed">
                        Your 90% net earnings arrive directly into Vietcombank every Monday at 10:00 AM ICT.
                      </p>
                    </div>
                  </div>

                  {/* Callout Banner */}
                  <div className="bg-[#e0eaeb] p-4 rounded-lg flex items-start gap-3 border border-[#dbe4e5]">
                    <span className="text-[#9b2f00] text-base mt-0.5">ℹ</span>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#141d1e]">
                        Transparent 10% Platform Commission
                      </span>
                      <p className="text-[11px] text-[#59413a] leading-relaxed">
                        Our flat 10% fee covers international credit card gateway costs, emergency satellite dispatcher monitoring, USFS/NPS compliance filings, and 24/7 guest evacuation insurance coordination. You keep 90% without hidden charges.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Verification Document */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-[#141d1e]">
                    Bank Account Confirmation or Voided Cheque Scan
                  </label>
                  <div className="p-4 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#b9eadb] text-[#39675b] flex items-center justify-center text-sm font-bold">
                        📄
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#141d1e] block">
                          vietcombank_account_verification.pdf
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-[#59413a]">1.8 MB</span>
                          <span className="text-[#59413a]">•</span>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#39675b] font-bold">
                            ✓ Verified Scan Uploaded
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showToast('File Replaced', 'New account verification scan uploaded.')}
                        className="px-3 py-1.5 rounded-lg bg-white text-[#141d1e] text-xs font-semibold hover:bg-[#e6f0f1] transition-colors border border-[#dbe4e5] cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast('File Cleared', 'Please re-upload before final review.')}
                        className="w-8 h-8 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 03: Electronic Tax & Invoicing */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-[#dbe4e5] space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-[#e6f0f1]">
                  <div className="w-8 h-8 rounded bg-[#c2410c]/10 text-[#c2410c] flex items-center justify-center font-mono text-xs font-bold">
                    03
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#141d1e]">
                      Electronic Tax &amp; Invoicing (VAT / e-Invoice)
                    </h2>
                    <p className="text-xs text-[#59413a]">
                      Legal compliance according to General Department of Taxation regulations.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tax Code */}
                  <div>
                    <label className="block text-xs font-bold text-[#141d1e] mb-2">
                      Tax Code / Enterprise Code (Mã số thuế)
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-3 rounded-lg font-mono text-xs sm:text-sm font-semibold tracking-wider border border-[#dbe4e5] focus:bg-white focus:outline-none transition-colors"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        type="text"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#39675b] text-base font-bold">
                        ✓
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#39675b] block mt-1">
                      Active business entity in Sapa, Lao Cai
                    </span>
                  </div>

                  {/* Invoicing Email */}
                  <div>
                    <label className="block text-xs font-bold text-[#141d1e] mb-2">
                      Official Registered Invoicing Email
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-3 rounded-lg text-xs sm:text-sm border border-[#dbe4e5] focus:bg-white focus:outline-none transition-colors"
                        value={invoicingEmail}
                        onChange={(e) => setInvoicingEmail(e.target.value)}
                        type="email"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#59413a] text-sm">
                        ✉
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#59413a] block mt-1">
                      E-invoices will be sent in XML &amp; PDF format
                    </span>
                  </div>
                </div>

                {/* Legal Agreement Checkbox */}
                <div className="p-4 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] flex items-start gap-3">
                  <input
                    checked={eInvoiceAuth}
                    onChange={(e) => setEInvoiceAuth(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded accent-[#9b2f00] cursor-pointer"
                    id="e-invoice-auth"
                    type="checkbox"
                  />
                  <label
                    className="text-xs text-[#141d1e] leading-relaxed cursor-pointer"
                    htmlFor="e-invoice-auth"
                  >
                    <span className="font-bold text-[#141d1e]">
                      I authorize SummitTrails Vietnam
                    </span>{' '}
                    to generate and dispatch electronic VAT commission invoices (Hóa đơn điện tử) following Circular 78/2021/TT-BTC on the 1st day of every month for previous month commissions.
                  </label>
                </div>
              </div>

              {/* Bottom Action Flow Bar */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onNavigate('partner_certificates')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#ecf5f6] text-[#141d1e] text-xs font-bold hover:bg-[#e0eaeb] transition-colors border border-[#dbe4e5] cursor-pointer"
                  >
                    <span>← Back to Step 2 (Certificates)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Draft Saved', 'Your bank preferences have been recorded.')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white text-[#59413a] text-xs font-semibold hover:text-[#141d1e] hover:bg-[#ecf5f6] transition-colors shadow-xs border border-[#dbe4e5] cursor-pointer"
                  >
                    <span>Save Draft</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-lg bg-[#c2410c] hover:bg-[#9b2f00] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>Continue to Final Review &amp; Sign</span>
                  <span>→</span>
                </button>
              </div>

              <div className="text-center sm:text-left pt-1">
                <p className="text-xs text-[#59413a]">
                  Bank details are verified by our finance desk within 24 business hours. Need special cross-border wire routing? Contact{' '}
                  <span className="text-[#9b2f00] underline">partners@summittrails.com</span>
                </p>
              </div>
            </div>

            {/* Right Column: Security, Summary Preview & Support (~32%) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Payout Security & Protection */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbe4e5] space-y-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#39675b] text-xl">🛡</span>
                  <h3 className="font-serif text-lg font-bold text-[#141d1e]">
                    Payout Protection
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ⇄
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#141d1e]">Direct Bank Transfers</h4>
                      <p className="text-[11px] text-[#59413a] mt-0.5 leading-relaxed">
                        Direct wire via national clearing system (NAPAS / SWIFT). 0 VND transfer fees on all weekly payouts.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      📅
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#141d1e]">Automated Monday Cycle</h4>
                      <p className="text-[11px] text-[#59413a] mt-0.5 leading-relaxed">
                        No manual withdrawal requests needed. Cleared funds arrive automatically every Monday morning at 10:00 AM.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      🔒
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#141d1e]">72-Hour Safety Window</h4>
                      <p className="text-[11px] text-[#59413a] mt-0.5 leading-relaxed">
                        Protects outfitters against fraudulent chargebacks and provides orderly payouts if alpine storms force safe reroutes.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      📜
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#141d1e]">Full Tax Compliance</h4>
                      <p className="text-[11px] text-[#59413a] mt-0.5 leading-relaxed">
                        Fully compliant with Vietnam e-invoicing standards (Circular 78/2021/TT-BTC) and international audits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Payout Summary Preview (Mock Calculation) */}
              <div className="bg-[#e0eaeb] rounded-xl p-6 shadow-sm border border-[#dbe4e5] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#39675b] uppercase tracking-wider">
                    Calculation Model
                  </span>
                  <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded text-[#141d1e] font-semibold border border-[#dbe4e5]">
                    Standard Split
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#141d1e] leading-tight">
                  Payout Summary Preview
                </h3>
                <p className="text-xs text-[#59413a]">
                  Here is how a typical Fansipan 3D2N Backcountry Expedition booking splits:
                </p>
                {/* Spec rows */}
                <div className="bg-white rounded-lg p-4 space-y-2.5 text-xs border border-[#dbe4e5]">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="text-[#59413a]">Example 3D2N Trek Booking</span>
                    <span className="font-mono font-bold text-[#141d1e]">10,000,000 ₫</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-1.5 text-[#59413a]">
                      <span>SummitTrails Fee (10%)</span>
                    </div>
                    <span className="font-mono font-semibold text-[#9b2f00]">-1,000,000 ₫</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="text-[#59413a]">Payment Processing &amp; Insurance</span>
                    <span className="font-mono text-[#39675b] font-medium">0 ₫ (Included)</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#141d1e] block font-bold">Net Payout to Bank</span>
                      <span className="font-mono text-[11px] text-[#39675b]">Every Monday 10:00 AM</span>
                    </div>
                    <span className="text-base font-bold text-[#39675b] font-mono">
                      9,000,000 ₫
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[#59413a]">
                  <span className="text-[#39675b] font-bold">⚡</span>
                  <span>Fast clearing to Vietcombank accounts</span>
                </div>
              </div>

              {/* Card 3: Support Contact Desk */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbe4e5] space-y-4">
                <span className="text-[11px] font-bold text-[#9b2f00] uppercase tracking-wider block">
                  Dedicated Guide Support
                </span>
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[#ecf5f6] overflow-hidden border border-[#dbe4e5]">
                      <img
                        className="w-full h-full object-cover"
                        alt="Mai Nguyen portrait"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqxlZwl_TyyqgZLFMvbysRvoIC_-4UImaVzzmtKsuzjCnnh6zJFX6rVV0XJvfGbScHg25ZF169Xsahp-NtwHXy3c_5XOhU1Z6c57xpj_F0w3OJ64fXY1RUhWINuj0V1JIcEAasCAb2FsBUI9YMNvjvC-UHugeeyx94Gl-UUQumyKN2Vz7aRnl99jLHSx4swrTVj82xzsXCdgUXCZsi2-sGtZebQ4c9ZPyqqt42ry6VXUi9QZjxJFY"
                      />
                    </div>
                    <span className="w-3 h-3 rounded-full bg-[#39675b] absolute bottom-0 right-0 ring-2 ring-white"></span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#141d1e] leading-snug">Mai Nguyen</h4>
                    <p className="text-[11px] text-[#59413a]">Head of Vietnam Guide Relations</p>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-[#141d1e] text-xs font-semibold">
                    <span className="text-[#9b2f00]">📞</span>
                    <span>+84 24 3942 8888</span>
                  </div>
                  <p className="text-xs text-[#59413a] leading-tight">
                    Direct phone &amp; WhatsApp support. Available Mon - Sat, 8:00 - 18:00 ICT.
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ecf5f6] text-[#39675b] font-mono text-[11px] border border-[#dbe4e5]">
                      <span>🌐</span> We speak English &amp; Tiếng Việt
                    </span>
                  </div>
                </div>
              </div>
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
