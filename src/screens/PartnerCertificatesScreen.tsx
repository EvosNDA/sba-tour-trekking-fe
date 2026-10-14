import React, { useState } from 'react';
import { ScreenId } from '../types/expedition';

interface Props {
  onNavigate: (screen: ScreenId) => void;
}

export const PartnerCertificatesScreen: React.FC<Props> = ({ onNavigate }) => {
  const [companyName, setCompanyName] = useState('Sapa Peak Expeditions Co.');
  const [licenseNumber, setLicenseNumber] = useState('VNM-TREK-8849-01');
  const [contactName, setContactName] = useState('Huu Minh Vu');
  const [email, setEmail] = useState('minh@sapapeaks.com');
  const [phone, setPhone] = useState('+84 912 345 678');
  const [guideCount, setGuideCount] = useState(4);
  const [satelliteChecked, setSatelliteChecked] = useState(true);
  const [termsEscrow, setTermsEscrow] = useState(true);
  const [termsTruth, setTermsTruth] = useState(true);

  // Region selections
  const [regions, setRegions] = useState<{ [key: string]: boolean }>({
    fansipan: true,
    langbiang: false,
    hagiang: true,
    phongnha: false,
  });

  // Toast state
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
    setRegions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const adjustGuideCount = (delta: number) => {
    setGuideCount((prev) => Math.max(1, prev + delta));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Application Progress Saved!', 'Advancing to Step 3: Bank Payouts Setup.');
    setTimeout(() => {
      onNavigate('partner_bank_payouts');
    }, 900);
  };

  return (
    <div className="w-full bg-[#f2fbfc] text-[#141d1e] min-h-screen font-sans">
      {/* Top Stepper Progress Header */}
      <section className="w-full bg-[#ecf5f6] py-6 shadow-sm border-b border-[#dbe4e5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="font-mono text-xs text-[#39675b] tracking-wider uppercase font-semibold">
                Step 2 of 4 • Operator Verification
              </span>
              <h2 className="text-xl text-[#141d1e] font-bold">Partner Onboarding</h2>
            </div>
            {/* Steps Breadcrumb */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              {/* Step 1 Done */}
              <div className="flex items-center gap-2.5 bg-[#e6f0f1] px-3.5 py-2 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#39675b] text-white flex items-center justify-center text-xs">
                  ✓
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#39675b] uppercase">Step 1</span>
                  <span className="text-xs text-[#141d1e] font-semibold">Company Info</span>
                </div>
              </div>
              {/* Step 2 Active */}
              <div className="flex items-center gap-2.5 bg-[#c2410c] text-white px-3.5 py-2 rounded-xl shadow-sm">
                <span className="w-6 h-6 rounded-full bg-[#9b2f00] text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase">Step 2</span>
                  <span className="text-xs font-semibold">Certificates</span>
                </div>
              </div>
              {/* Step 3 */}
              <button
                type="button"
                onClick={() => onNavigate('partner_bank_payouts')}
                className="flex items-center gap-2.5 bg-[#f2fbfc] px-3.5 py-2 rounded-xl opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-[#dbe4e5] text-[#59413a] flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#59413a] uppercase">Step 3</span>
                  <span className="text-xs text-[#59413a]">Bank Payouts</span>
                </div>
              </button>
              {/* Step 4 */}
              <button
                type="button"
                onClick={() => onNavigate('partner_final_review')}
                className="flex items-center gap-2.5 bg-[#f2fbfc] px-3.5 py-2 rounded-xl opacity-80 hover:opacity-100 transition-opacity text-left cursor-pointer"
              >
                <span className="w-6 h-6 rounded-full bg-[#dbe4e5] text-[#59413a] flex items-center justify-center text-xs font-medium">
                  4
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#59413a] uppercase">Step 4</span>
                  <span className="text-xs text-[#59413a]">Review</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column Primary Form (~65%) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Header Banner Block */}
            <div className="bg-[#ecf5f6] p-8 rounded-xl shadow-sm relative overflow-hidden border border-[#dbe4e5]">
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b9eadb] text-[#3d6b5f] text-xs font-bold uppercase tracking-wider">
                  <span className="font-bold">★</span>
                  <span>Official Outfitter Application</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#141d1e] tracking-tight leading-tight">
                  Join Our Tour Partner Network
                </h1>
                <p className="text-sm sm:text-base text-[#59413a] max-w-2xl leading-relaxed">
                  Sign up your company, submit safety certificates, and start listing trekking trips in 48 hours.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* SECTION 1: Company & Contact Information */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-[#dbe4e5] space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e6f0f1] flex items-center justify-center text-[#9b2f00] font-bold font-mono text-xs">
                    01
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-[#141d1e] font-semibold">
                      Company &amp; Contact Information
                    </h3>
                    <p className="text-xs text-[#59413a]">
                      Tell us who you are and where your mountain trips go.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="text-xs text-[#141d1e] block font-semibold">
                      Registered Company Name
                    </label>
                    <input
                      className="w-full bg-[#ecf5f6] text-[#141d1e] text-sm px-4 py-2.5 rounded-lg border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      type="text"
                    />
                  </div>
                  {/* License Number */}
                  <div className="space-y-2">
                    <label className="text-xs text-[#141d1e] block font-semibold">
                      Business License Number
                    </label>
                    <input
                      className="w-full bg-[#ecf5f6] text-[#141d1e] text-sm px-4 py-2.5 rounded-lg border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      required
                      type="text"
                    />
                  </div>
                  {/* Lead Contact Name */}
                  <div className="space-y-2">
                    <label className="text-xs text-[#141d1e] block font-semibold">
                      Lead Contact Person
                    </label>
                    <input
                      className="w-full bg-[#ecf5f6] text-[#141d1e] text-sm px-4 py-2.5 rounded-lg border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      type="text"
                    />
                  </div>
                  {/* Work Email */}
                  <div className="space-y-2">
                    <label className="text-xs text-[#141d1e] block font-semibold">
                      Work Email Address
                    </label>
                    <input
                      className="w-full bg-[#ecf5f6] text-[#141d1e] text-sm px-4 py-2.5 rounded-lg border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      type="email"
                    />
                  </div>
                  {/* Phone */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs text-[#141d1e] block font-semibold">
                      Phone / WhatsApp Number (For Mountain Dispatch)
                    </label>
                    <input
                      className="w-full bg-[#ecf5f6] text-[#141d1e] text-sm px-4 py-2.5 rounded-lg border border-[#dbe4e5] focus:outline-none focus:bg-white focus:border-[#c2410c]"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      type="tel"
                    />
                    <span className="text-xs text-[#59413a]">
                      We send instant SMS notifications when travelers book your tours.
                    </span>
                  </div>
                </div>

                {/* Operating Regions */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs text-[#141d1e] block font-semibold">
                    Operating Trekking Regions (Select all you guide in)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#ecf5f6] hover:bg-[#e6f0f1] cursor-pointer transition-colors shadow-xs border border-[#dbe4e5]">
                      <input
                        checked={regions.fansipan}
                        onChange={() => handleRegionToggle('fansipan')}
                        className="w-4 h-4 accent-[#9b2f00] rounded cursor-pointer"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#141d1e]">
                          Fansipan &amp; Hoang Lien Son
                        </span>
                        <span className="font-mono text-[11px] text-[#59413a]">
                          Peak • 3,143m high
                        </span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#ecf5f6] hover:bg-[#e6f0f1] cursor-pointer transition-colors shadow-xs border border-[#dbe4e5]">
                      <input
                        checked={regions.langbiang}
                        onChange={() => handleRegionToggle('langbiang')}
                        className="w-4 h-4 accent-[#9b2f00] rounded cursor-pointer"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#141d1e]">
                          Langbiang &amp; Da Lat Plateaus
                        </span>
                        <span className="font-mono text-[11px] text-[#59413a]">
                          Pine forests • 2,167m
                        </span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#ecf5f6] hover:bg-[#e6f0f1] cursor-pointer transition-colors shadow-xs border border-[#dbe4e5]">
                      <input
                        checked={regions.hagiang}
                        onChange={() => handleRegionToggle('hagiang')}
                        className="w-4 h-4 accent-[#9b2f00] rounded cursor-pointer"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#141d1e]">
                          Ha Giang Karst Geopark
                        </span>
                        <span className="font-mono text-[11px] text-[#59413a]">
                          Canyon trails &amp; passes
                        </span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#ecf5f6] hover:bg-[#e6f0f1] cursor-pointer transition-colors shadow-xs border border-[#dbe4e5]">
                      <input
                        checked={regions.phongnha}
                        onChange={() => handleRegionToggle('phongnha')}
                        className="w-4 h-4 accent-[#9b2f00] rounded cursor-pointer"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#141d1e]">
                          Phong Nha Cave Expeditions
                        </span>
                        <span className="font-mono text-[11px] text-[#59413a]">
                          Jungle &amp; river trekking
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Safety Certificates & Guide Licenses */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-[#dbe4e5] space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e6f0f1] flex items-center justify-center text-[#9b2f00] font-bold font-mono text-xs">
                    02
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-[#141d1e] font-semibold">
                      Safety Certificates &amp; Guide Licenses
                    </h3>
                    <p className="text-xs text-[#59413a]">
                      We require active licenses before publishing any trek.
                    </p>
                  </div>
                </div>

                {/* Notice Box */}
                <div className="p-4 rounded-xl bg-[#b9eadb]/40 text-[#141d1e] border border-[#b9eadb] flex items-start gap-3 shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-[#39675b] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider block text-[#1f4e43]">
                      Why we ask for this
                    </span>
                    <p className="text-xs text-[#39675b] leading-relaxed">
                      Every partner must have valid mountain safety permits and first aid training to keep travelers safe on trails.
                    </p>
                  </div>
                </div>

                {/* Upload Slot 1: Pre-uploaded state */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-[#141d1e] font-bold">
                      1. Tour Operator Business License
                    </label>
                    <span className="font-mono text-xs text-[#39675b] font-semibold flex items-center gap-1">
                      ✓ Approved Scan
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#b9eadb] text-[#3d6b5f] flex items-center justify-center font-bold text-sm">
                        PDF
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#141d1e]">license_vn_2024.pdf</p>
                        <p className="font-mono text-[11px] text-[#59413a]">2.4 MB • Uploaded 5 mins ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showToast('Viewing File', 'license_vn_2024.pdf verified by system')}
                        className="px-3 py-1.5 text-xs text-[#141d1e] hover:bg-white rounded-lg bg-[#e6f0f1] transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast('Replaced License', 'Uploaded new verification draft')}
                        className="px-3 py-1.5 text-xs text-[#9b2f00] hover:bg-white rounded-lg bg-[#e6f0f1] transition-colors cursor-pointer"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload Slot 2: Drag and drop First Aid */}
                <div className="space-y-2">
                  <label className="text-xs text-[#141d1e] font-bold">
                    2. Lead Guide Wilderness First Aid (WFA / WAFA) or Red Cross Card
                  </label>
                  <div
                    onClick={() => showToast('Document Attached', 'WFR Certificate #9912 attached for verification.')}
                    className="p-8 rounded-xl bg-[#ecf5f6] text-center hover:bg-[#e6f0f1] transition-colors cursor-pointer border-2 border-dashed border-[#dbe4e5] group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white group-hover:bg-[#9b2f00] group-hover:text-white text-[#9b2f00] mx-auto flex items-center justify-center transition-all mb-2 shadow-xs font-bold">
                      ↑
                    </div>
                    <h4 className="text-xs font-semibold text-[#141d1e] mb-1">
                      Click or drop file here
                    </h4>
                    <p className="text-[11px] text-[#59413a]">PDF, JPG, or PNG up to 15MB</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white text-[#39675b] font-mono text-[11px] border border-[#dbe4e5]">
                      <span>✓ Valid within last 2 years</span>
                    </div>
                  </div>
                </div>

                {/* Upload Slot 3: National Park Permit */}
                <div className="space-y-2">
                  <label className="text-xs text-[#141d1e] font-bold">
                    3. National Park Commercial Trekking Authorization Permit
                  </label>
                  <div
                    onClick={() => showToast('Permit Attached', 'Hoang Lien National Park Permit HLNP-2024-C92 verified.')}
                    className="p-4 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] hover:bg-[#e6f0f1] cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-lg bg-white text-[#39675b] flex items-center justify-center font-bold text-sm">
                          🌲
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#141d1e]">
                            Hoang Lien Park Commercial Concession Permit
                          </p>
                          <p className="font-mono text-[11px] text-[#59413a]">
                            Agreement #HLNP-2024-C92 • Max 20MB
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 bg-white text-[#141d1e] text-xs font-semibold rounded-lg shadow-xs border border-[#dbe4e5]">
                        Select File
                      </span>
                    </div>
                  </div>
                </div>

                {/* Number of Guides & Radio SOS Check */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Certified Guide Counter */}
                  <div className="space-y-2">
                    <label className="text-xs text-[#141d1e] font-bold">
                      Certified Mountain Guides on Staff
                    </label>
                    <div className="flex items-center gap-3 bg-[#ecf5f6] p-2 rounded-xl border border-[#dbe4e5]">
                      <button
                        type="button"
                        onClick={() => adjustGuideCount(-1)}
                        className="w-9 h-9 rounded-lg bg-white text-[#141d1e] hover:bg-[#e6f0f1] flex items-center justify-center font-bold text-base shadow-xs cursor-pointer"
                      >
                        -
                      </button>
                      <div className="text-center w-full font-mono text-xs font-bold text-[#141d1e]">
                        {guideCount} certified guides
                      </div>
                      <button
                        type="button"
                        onClick={() => adjustGuideCount(1)}
                        className="w-9 h-9 rounded-lg bg-white text-[#141d1e] hover:bg-[#e6f0f1] flex items-center justify-center font-bold text-base shadow-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[11px] text-[#59413a]">
                      Must hold national or international badges.
                    </span>
                  </div>

                  {/* Satellite Device Assurance */}
                  <div className="space-y-2 flex flex-col justify-end">
                    <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#ecf5f6] cursor-pointer shadow-xs border border-[#dbe4e5] hover:bg-[#e6f0f1] transition-colors">
                      <input
                        checked={satelliteChecked}
                        onChange={(e) => setSatelliteChecked(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-[#9b2f00] rounded cursor-pointer"
                        type="checkbox"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#141d1e]">
                          Satellite SOS device ready
                        </span>
                        <span className="text-[11px] text-[#59413a]">
                          Our team carries Garmin InReach or radio trackers on all treks.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Partner Agreement & Terms */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-[#dbe4e5] space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e6f0f1] flex items-center justify-center text-[#9b2f00] font-bold font-mono text-xs">
                    03
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-[#141d1e] font-semibold">
                      Partner Agreement
                    </h3>
                    <p className="text-xs text-[#59413a]">
                      Simple rules to protect guests and local mountain guides.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] cursor-pointer">
                    <input
                      checked={termsEscrow}
                      onChange={(e) => setTermsEscrow(e.target.checked)}
                      required
                      className="w-4 h-4 mt-0.5 accent-[#9b2f00] rounded cursor-pointer"
                      type="checkbox"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#141d1e]">
                        72-Hour Safety Escrow Payout Rule
                      </span>
                      <span className="text-[11px] text-[#59413a]">
                        I understand customer tour payments are released directly to my bank 72 hours after the trek completes safely without incident.
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-[#ecf5f6] border border-[#dbe4e5] cursor-pointer">
                    <input
                      checked={termsTruth}
                      onChange={(e) => setTermsTruth(e.target.checked)}
                      required
                      className="w-4 h-4 mt-0.5 accent-[#9b2f00] rounded cursor-pointer"
                      type="checkbox"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#141d1e]">
                        Truth in Mountain Licensing
                      </span>
                      <span className="text-[11px] text-[#59413a]">
                        I confirm all submitted certificates and licenses are authentic, legal, and actively monitored by our lead operations guide.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#9b2f00] hover:bg-[#c2410c] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <span>Save &amp; Continue to Bank Payouts (Step 3)</span>
                    <span>→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Draft Saved', 'Your progress is stored in local state.')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#141d1e] text-xs font-semibold rounded-xl shadow-xs border border-[#dbe4e5] hover:bg-[#ecf5f6] transition-colors cursor-pointer"
                  >
                    <span>Save Draft</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[#59413a] text-xs pt-1">
                  <span>⏱</span>
                  <span>
                    Our safety audit team reviews files in <strong>2 business days</strong>. Questions? Write to <span className="text-[#9b2f00] underline">partners@summittrails.com</span>
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column / Sidebar Info & Support (~35%) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Why Partner With Us Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#dbe4e5] space-y-5">
              <div className="flex items-center gap-2 text-[#9b2f00]">
                <span className="text-lg">★</span>
                <h3 className="text-base text-[#141d1e] font-bold">Why Partner With Us?</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ecf5f6] text-[#39675b] flex items-center justify-center shrink-0 text-sm font-bold">
                    0₫
                  </div>
                  <div>
                    <h4 className="text-xs text-[#141d1e] font-bold">0 VND Setup Fee</h4>
                    <p className="text-[11px] text-[#59413a]">
                      It is completely free to create your profile and list your trekking expeditions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ecf5f6] text-[#39675b] flex items-center justify-center shrink-0 text-sm font-bold">
                    📅
                  </div>
                  <div>
                    <h4 className="text-xs text-[#141d1e] font-bold">Weekly Payouts</h4>
                    <p className="text-[11px] text-[#59413a]">
                      Automatic bank transfers into your business account every single Monday.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ecf5f6] text-[#39675b] flex items-center justify-center shrink-0 text-sm font-bold">
                    👥
                  </div>
                  <div>
                    <h4 className="text-xs text-[#141d1e] font-bold">Over 25,000 Travelers</h4>
                    <p className="text-[11px] text-[#59413a]">
                      Connect with enthusiastic alpine hikers, peak baggers, and overseas travelers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Checklist Card */}
            <div className="bg-[#ecf5f6] p-6 rounded-xl shadow-sm border border-[#dbe4e5] space-y-3">
              <div className="flex items-center gap-2 text-[#39675b]">
                <span className="text-sm font-bold">✓</span>
                <h4 className="text-xs text-[#141d1e] font-bold">Fast Approval Checklist</h4>
              </div>
              <p className="text-[11px] text-[#59413a]">
                Partners with these documents are approved within 24 hours:
              </p>
              <ul className="space-y-2 text-xs text-[#141d1e]">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span>Clear color scan of business license</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span>Valid first-aid certificate within 2 yrs</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#b9eadb] text-[#39675b] flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span>National Park trek permit agreement</span>
                </li>
              </ul>
              <div className="pt-2">
                <div className="bg-white p-2.5 rounded-lg flex items-center justify-between border border-[#dbe4e5]">
                  <span className="font-mono text-[11px] text-[#59413a]">Queue Delay:</span>
                  <span className="font-mono text-[11px] text-[#39675b] font-bold">~1.5 Days</span>
                </div>
              </div>
            </div>

            {/* Support Box with Mai Nguyen */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#dbe4e5] space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#ecf5f6] overflow-hidden shrink-0 border border-[#dbe4e5]">
                  <img
                    className="w-full h-full object-cover"
                    alt="Mai Nguyen portrait"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9yoAcsqVr9ETsY5Bt_zV1lm3igc7SP4vRROAHeUkPQYlpngsr5r7D85F8OoKBnA_YNq0KRUt4ubge1WO5AIsUwTBDLg7xWPMiHW-a3aWFL4FeCQGtxicQq44sJwKOyqAu0w1aNyzz1ZNPw2LRsiBzJejtdPYMWqhX1atRpSdtZ7bAR814lMDHmJrZrlQD1XuInf9UALyElgo5Ypzt2MvavYq5rtbXuYf_cueuqIilpNIWtgt2YJ0"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#141d1e]">Mai Nguyen</h4>
                  <p className="text-[11px] text-[#39675b] font-medium">Head of Vietnam Guide Relations</p>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#39675b]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#39675b]"></span> Online Dispatch
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#59413a] leading-relaxed">
                Have questions about guide requirements or bank documents? Contact our local guide desk directly.
              </p>
              <div className="space-y-2 pt-1">
                <a
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#39675b] hover:bg-[#204f44] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  href="tel:+842439428888"
                >
                  <span>📞 Call / WhatsApp: +84 24 3942 8888</span>
                </a>
                <button
                  type="button"
                  onClick={() => onNavigate('partner_bank_payouts')}
                  className="w-full text-center py-2 text-xs text-[#141d1e] font-semibold bg-[#ecf5f6] hover:bg-[#e6f0f1] rounded-lg transition-colors cursor-pointer"
                >
                  Skip to Step 3: Bank Payouts →
                </button>
              </div>
            </div>
          </aside>
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
