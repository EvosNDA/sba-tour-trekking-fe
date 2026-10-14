import React, { useState } from 'react';
import { ScreenId } from '../../../types/expedition';

export interface PartnerDashboardPageProps {
  onNavigate?: (screen: ScreenId) => void;
}

export const PartnerDashboardPage: React.FC<PartnerDashboardPageProps> = ({
  onNavigate = () => {},
}) => {
  const [businessName, setBusinessName] = useState('Sapa Peak Expeditions Company Limited');
  const [taxCode, setTaxCode] = useState('0108924155');
  const [entityType, setEntityType] = useState('Private Limited Company (TNHH)');
  const [yearFounded, setYearFounded] = useState('2018');
  const [headquarters, setHeadquarters] = useState('42 Muong Hoa Valley Road, Sapa District, Lao Cai Province, Vietnam');
  const [leadContact, setLeadContact] = useState('Huu Minh Vu');
  const [corporateTitle, setCorporateTitle] = useState('Founder & Lead Expedition Director');
  const [workEmail, setWorkEmail] = useState('minh@sapapeaks.com');
  const [operationsPhone, setOperationsPhone] = useState('+84 912 345 678');
  const [radioCallsign, setRadioCallsign] = useState('VHF 144.390 MHz • Channel 07 (Basecamp Sapa)');
  const [annualCapacity, setAnnualCapacity] = useState('500 - 1,500 Trekkers / Year');
  const [companyBio, setCompanyBio] = useState(
    'Founded in 2018 by local Hmong guides and alpine enthusiasts, Sapa Peak Expeditions operates verified guided climbs up Fansipan (3,143m), Ky Quan San, and northern highland ridges with strict Leave-No-Trace principles and fair porter wages.'
  );

  // Region selections
  const [selectedRegions, setSelectedRegions] = useState<{ [key: string]: boolean }>({
    fansipan: true,
    langbiang: false,
    hagiang: true,
    phongnha: false,
    bachmoc: true,
  });

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

  const handleRegionToggle = (key: string) => {
    setSelectedRegions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Company Info Saved', 'Proceeding to Step 2: Certificates & Safety.');
    setTimeout(() => {
      onNavigate('partner_certificates');
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
            <span className="font-mono text-xs text-[#59413a]">Step 1 of 4</span>
          </div>
        </div>
      </div>

      {/* Stepper Header Container */}
      <div className="w-full bg-white shadow-xs border-b border-[#dbe4e5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Step 1 Active */}
            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ffdbd0] shadow-xs border border-[#ffb59d]">
              <div className="w-8 h-8 rounded-full bg-[#c2410c] text-white flex items-center justify-center shrink-0 shadow-xs text-xs font-bold">
                1
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[#9b2f00] uppercase tracking-wider">
                  In Progress
                </span>
                <span className="text-sm font-bold text-[#390c00] truncate">
                  Company Info
                </span>
              </div>
            </div>

            {/* Step 2 Pending */}
            <button
              type="button"
              onClick={() => onNavigate('partner_certificates')}
              className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ecf5f6]/60 opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#d2dcdd] text-[#59413a] flex items-center justify-center shrink-0 text-xs font-bold">
                2
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[#59413a] uppercase tracking-wider">
                  Step 2
                </span>
                <span className="text-sm text-[#141d1e] truncate">Certificates</span>
              </div>
            </button>

            {/* Step 3 Pending */}
            <button
              type="button"
              onClick={() => onNavigate('partner_bank_payouts')}
              className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ecf5f6]/60 opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#d2dcdd] text-[#59413a] flex items-center justify-center shrink-0 text-xs font-bold">
                3
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[#59413a] uppercase tracking-wider">
                  Step 3
                </span>
                <span className="text-sm text-[#141d1e] truncate">Bank Payouts</span>
              </div>
            </button>

            {/* Step 4 Pending */}
            <button
              type="button"
              onClick={() => onNavigate('partner_final_review')}
              className="flex items-center gap-3.5 p-3 rounded-lg bg-[#ecf5f6]/60 opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer"
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
              <span>🏢</span> Official Outfitter Legal Registry
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#141d1e] mb-3 leading-tight">
              Step 1: Set Up Your Company Profile
            </h1>
            <p className="text-base text-[#59413a] leading-relaxed">
              Register your commercial outfitter entity, base of operations, and expedition leadership team to unlock booking verification and dispatch tools.
            </p>
          </div>

          {/* Two-Column Primary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Form & Sections (~68%) */}
            <div className="lg:col-span-8 space-y-10">
              <form onSubmit={handleNextStep} className="space-y-10">
                {/* Section 01: Core Business & Legal Entity */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-[#dbe4e5] space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#e6f0f1]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#c2410c]/10 text-[#c2410c] flex items-center justify-center font-mono text-xs font-bold">
                        01
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#141d1e]">
                          Registered Legal Entity &amp; Headquarters
                        </h2>
                        <p className="text-xs text-[#59413a]">
                          Official company name as recorded with the Ministry of Planning and Investment.
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#b9eadb] text-[#3d6b5f] font-mono text-xs font-semibold">
                      <span>✓</span> Legal Verification
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Registered Business Name */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e] flex items-center justify-between">
                        <span>Full Registered Business Name</span>
                        <span className="font-mono text-[10px] text-[#9b2f00]">Required</span>
                      </label>
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-2.5 rounded-lg text-sm font-semibold border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                        type="text"
                      />
                      <span className="text-[11px] text-[#59413a] block">
                        Must match your business license and the bank receiving account in Step 3.
                      </span>
                    </div>

                    {/* Tax Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Tax Identification / Enterprise Code (MST)
                      </label>
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-2.5 rounded-lg font-mono text-xs sm:text-sm font-bold border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        required
                        type="text"
                      />
                    </div>

                    {/* Entity Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Entity Type
                      </label>
                      <select
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value)}
                        className="w-full bg-white text-[#141d1e] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold border border-[#dbe4e5] focus:outline-none focus:border-[#c2410c] cursor-pointer"
                      >
                        <option value="Private Limited Company (TNHH)">Private Limited Company (TNHH)</option>
                        <option value="Joint Stock Company (JSC)">Joint Stock Company (JSC)</option>
                        <option value="Licensed Outfitter Cooperative">Licensed Outfitter Cooperative</option>
                        <option value="Sole Commercial Outfitter">Sole Commercial Outfitter</option>
                      </select>
                    </div>

                    {/* Year Established */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Year Founded / Operations Start
                      </label>
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-2.5 rounded-lg text-xs sm:text-sm border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                        value={yearFounded}
                        onChange={(e) => setYearFounded(e.target.value)}
                        type="text"
                      />
                    </div>

                    {/* Annual Capacity */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Annual Guided Capacity
                      </label>
                      <select
                        value={annualCapacity}
                        onChange={(e) => setAnnualCapacity(e.target.value)}
                        className="w-full bg-white text-[#141d1e] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold border border-[#dbe4e5] focus:outline-none focus:border-[#c2410c] cursor-pointer"
                      >
                        <option value="100 - 500 Trekkers / Year">100 - 500 Trekkers / Year</option>
                        <option value="500 - 1,500 Trekkers / Year">500 - 1,500 Trekkers / Year</option>
                        <option value="1,500 - 5,000 Trekkers / Year">1,500 - 5,000 Trekkers / Year</option>
                        <option value="5,000+ Trekkers / Year">5,000+ Trekkers / Year</option>
                      </select>
                    </div>

                    {/* Headquarters Address */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Headquarters &amp; Dispatch Office Address
                      </label>
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-2.5 rounded-lg text-xs sm:text-sm border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                        value={headquarters}
                        onChange={(e) => setHeadquarters(e.target.value)}
                        required
                        type="text"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 02: Primary Executive & Mountain Operations Director */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-[#dbe4e5] space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-[#e6f0f1]">
                    <div className="w-8 h-8 rounded bg-[#c2410c]/10 text-[#c2410c] flex items-center justify-center font-mono text-xs font-bold">
                      02
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#141d1e]">
                        Lead Expedition Director &amp; Dispatcher
                      </h2>
                      <p className="text-xs text-[#59413a]">
                        Primary contact person responsible for safety briefings, guide rosters, and guest care.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lead Contact */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Lead Director / Founder Name
                      </label>
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                        value={leadContact}
                        onChange={(e) => setLeadContact(e.target.value)}
                        required
                        type="text"
                      />
                    </div>

                    {/* Corporate Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Corporate Title
                      </label>
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-2.5 rounded-lg text-xs sm:text-sm border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                        value={corporateTitle}
                        onChange={(e) => setCorporateTitle(e.target.value)}
                        required
                        type="text"
                      />
                    </div>

                    {/* Work Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Official Operations Email
                      </label>
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-2.5 rounded-lg text-xs sm:text-sm border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        required
                        type="email"
                      />
                    </div>

                    {/* Operations Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Direct Phone / WhatsApp (For Urgent Dispatch)
                      </label>
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-2.5 rounded-lg text-xs sm:text-sm border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                        value={operationsPhone}
                        onChange={(e) => setOperationsPhone(e.target.value)}
                        required
                        type="tel"
                      />
                    </div>

                    {/* Radio Call-sign */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-[#141d1e]">
                        Base Station Radio Frequency / Satellite Phone Call-sign
                      </label>
                      <input
                        className="w-full bg-[#ecf5f6] text-[#141d1e] px-4 py-2.5 rounded-lg font-mono text-xs sm:text-sm border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                        value={radioCallsign}
                        onChange={(e) => setRadioCallsign(e.target.value)}
                        type="text"
                      />
                      <span className="text-[11px] text-[#59413a]">
                        Optional: shared with our Sapa Central Emergency Rescue desk.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 03: Trekking Fleet, Sectors & Commercial Scale */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-[#dbe4e5] space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-[#e6f0f1]">
                    <div className="w-8 h-8 rounded bg-[#c2410c]/10 text-[#c2410c] flex items-center justify-center font-mono text-xs font-bold">
                      03
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#141d1e]">
                        Operating Mountain Sectors &amp; Company Bio
                      </h2>
                      <p className="text-xs text-[#59413a]">
                        Choose your licensed guiding corridors and tell travelers about your alpine heritage.
                      </p>
                    </div>
                  </div>

                  {/* Operating Mountain Sectors */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#141d1e] block">
                      Licensed Guiding Sectors (Select all applicable)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] cursor-pointer hover:bg-[#e0eaeb] transition-colors">
                        <input
                          checked={selectedRegions.fansipan}
                          onChange={() => handleRegionToggle('fansipan')}
                          className="w-4 h-4 accent-[#9b2f00] rounded cursor-pointer"
                          type="checkbox"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#141d1e]">Fansipan Ridge</p>
                          <span className="font-mono text-[10px] text-[#59413a]">Peak 3,143m • Sapa</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] cursor-pointer hover:bg-[#e0eaeb] transition-colors">
                        <input
                          checked={selectedRegions.bachmoc}
                          onChange={() => handleRegionToggle('bachmoc')}
                          className="w-4 h-4 accent-[#9b2f00] rounded cursor-pointer"
                          type="checkbox"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#141d1e]">Bach Moc Luong Tu</p>
                          <span className="font-mono text-[10px] text-[#59413a]">Cloud Sea • 3,046m</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] cursor-pointer hover:bg-[#e0eaeb] transition-colors">
                        <input
                          checked={selectedRegions.hagiang}
                          onChange={() => handleRegionToggle('hagiang')}
                          className="w-4 h-4 accent-[#9b2f00] rounded cursor-pointer"
                          type="checkbox"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#141d1e]">Ha Giang Karst</p>
                          <span className="font-mono text-[10px] text-[#59413a]">Canyons &amp; Passes</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] cursor-pointer hover:bg-[#e0eaeb] transition-colors">
                        <input
                          checked={selectedRegions.langbiang}
                          onChange={() => handleRegionToggle('langbiang')}
                          className="w-4 h-4 accent-[#9b2f00] rounded cursor-pointer"
                          type="checkbox"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#141d1e]">Langbiang Plateaus</p>
                          <span className="font-mono text-[10px] text-[#59413a]">Da Lat • 2,167m</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#ecf5f6] border border-[#dbe4e5] cursor-pointer hover:bg-[#e0eaeb] transition-colors">
                        <input
                          checked={selectedRegions.phongnha}
                          onChange={() => handleRegionToggle('phongnha')}
                          className="w-4 h-4 accent-[#9b2f00] rounded cursor-pointer"
                          type="checkbox"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#141d1e]">Phong Nha Jungle</p>
                          <span className="font-mono text-[10px] text-[#59413a]">Caves &amp; Rivers</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Company Bio */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-[#141d1e]">
                      Outfitter Bio &amp; Wilderness Philosophy
                    </label>
                    <textarea
                      rows={3}
                      value={companyBio}
                      onChange={(e) => setCompanyBio(e.target.value)}
                      className="w-full bg-[#ecf5f6] text-[#141d1e] p-3 rounded-lg text-xs sm:text-sm border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c] leading-relaxed"
                    />
                    <span className="text-[11px] text-[#59413a] block">
                      Displayed on your public partner profile in the WeTrek marketplace.
                    </span>
                  </div>
                </div>

                {/* Bottom Action Flow Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => onNavigate('marketplace')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#ecf5f6] text-[#141d1e] text-xs font-bold hover:bg-[#e0eaeb] transition-colors border border-[#dbe4e5] cursor-pointer"
                    >
                      <span>← Back to Marketplace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Draft Saved', 'Company information safely stored.')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white text-[#59413a] text-xs font-semibold hover:text-[#141d1e] hover:bg-[#ecf5f6] transition-colors shadow-xs border border-[#dbe4e5] cursor-pointer"
                    >
                      <span>Save Draft</span>
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-lg bg-[#c2410c] hover:bg-[#9b2f00] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <span>Save &amp; Continue to Step 2 (Certificates)</span>
                    <span>→</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Sidebar Info & Support (~32%) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Fast Track Approval */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbe4e5] space-y-4">
                <div className="flex items-center gap-2 text-[#39675b]">
                  <span className="text-base font-bold">✓</span>
                  <h3 className="text-sm font-bold text-[#141d1e]">
                    Step 1 Verification Requirements
                  </h3>
                </div>
                <p className="text-xs text-[#59413a] leading-relaxed">
                  We match your company tax code and business name against the National Tourism Database:
                </p>
                <div className="space-y-2 text-xs text-[#141d1e]">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Active Vietnamese enterprise code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Direct phone line for dispatch emergencies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Named expedition operations director</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="bg-[#ecf5f6] p-2.5 rounded-lg flex items-center justify-between border border-[#dbe4e5]">
                    <span className="font-mono text-[11px] text-[#59413a]">Typical Review Speed:</span>
                    <span className="font-mono text-[11px] text-[#39675b] font-bold">Under 24 Hours</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Support Contact Desk */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#dbe4e5] space-y-4">
                <span className="text-[11px] font-bold text-[#9b2f00] uppercase tracking-wider block">
                  Dedicated Partner Onboarding Desk
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

              {/* Card 3: Next Steps preview */}
              <div className="bg-[#e0eaeb] rounded-xl p-5 border border-[#dbe4e5] space-y-2">
                <span className="text-[11px] font-bold text-[#39675b] uppercase tracking-wider block">
                  Coming Up in Step 2:
                </span>
                <p className="text-xs text-[#141d1e] font-semibold">
                  Certificates &amp; Safety Compliance
                </p>
                <p className="text-[11px] text-[#59413a] leading-relaxed">
                  Prepare your PDF scan of the business registration license, Wilderness First Aid badges for your lead guides, and your Hoang Lien park agreement.
                </p>
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

export default PartnerDashboardPage;
