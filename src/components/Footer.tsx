import React from 'react';
import { Shield, Sparkles, CheckCircle, Radio } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#F7F4EE] border-t border-[#E6E1D8] mt-16 text-[#1C2526]">
      {/* Three Pillars Certification Badges */}
      <div className="border-b border-[#E6E1D8] py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C2526] mb-1">
                Safety Rules
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed mb-1.5">
                We follow all international mountain safety standards and carry emergency satellite radios on every trip.
              </p>
              <span className="text-[10px] font-mono font-medium text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#E6E1D8]">
                CERT ID: MRA-AL-2024-884
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C2526] mb-1">
                Nature Care
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed mb-1.5">
                We protect nature and leave no trash behind. All waste is safely packed out from the mountain.
              </p>
              <span className="text-[10px] font-mono font-medium text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#E6E1D8]">
                STEWARDSHIP GRADE: CLASS-I
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#1F4E43] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C2526] mb-1">
                Official Licenses
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed mb-1.5">
                Certified tour guides with verified permits from the National Park and Forest Department.
              </p>
              <span className="text-[10px] font-mono font-medium text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#E6E1D8]">
                GOVERNANCE REGISTRY #7719
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Links Grid */}
      <div className="py-12 px-4 md:px-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
        <div>
          <h3 className="font-editorial text-lg font-bold text-[#C2410C] mb-2">
            TrekMarket
          </h3>
          <p className="text-[#64748B] leading-relaxed mb-4">
            An easy website to find and book mountain hiking trips with trusted local guides, verified companies, and 100% safe payments.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#78716C]">
            <span className="bg-white border border-[#E6E1D8] px-2 py-0.5 rounded">Clear Maps</span>
            <span className="bg-white border border-[#E6E1D8] px-2 py-0.5 rounded">Safe Money</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">
            For Travelers
          </h4>
          <ul className="space-y-2 text-[#64748B]">
            <li><a href="#tours" className="hover:text-[#1C2526]">Find Mountain Tours</a></li>
            <li><a href="#safety" className="hover:text-[#1C2526]">Compare Guide Safety</a></li>
            <li><a href="#weather" className="hover:text-[#1C2526]">Weather & Trail Info</a></li>
            <li><a href="#insurance" className="hover:text-[#1C2526]">Trip Insurance Info</a></li>
            <li><a href="#checklist" className="hover:text-[#1C2526]">What to Bring Checklist</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">
            For Tour Partners
          </h4>
          <ul className="space-y-2 text-[#64748B]">
            <li><a href="#join" className="hover:text-[#1C2526]">Join as a Tour Guide</a></li>
            <li><a href="#rules" className="hover:text-[#1C2526]">Guide Safety Rules</a></li>
            <li><a href="#payouts" className="hover:text-[#1C2526]">How Payouts Work</a></li>
            <li><a href="#manage" className="hover:text-[#1C2526]">Manage Your Tours</a></li>
            <li><a href="#partner-login" className="hover:text-[#1C2526]">Partner Log In</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[#1C2526] mb-3 uppercase tracking-wider text-[11px]">
            Help & Support
          </h4>
          <div className="space-y-2 text-[#64748B]">
            <div>
              <span className="block text-[10px] uppercase font-mono text-[#78716C]">
                24/7 Emergency Phone
              </span>
              <a href="tel:18002574630" className="font-bold text-[#C2410C] hover:underline font-mono">
                1-800-ALPINE-0
              </a>
            </div>
            <div className="pt-1">
              <span className="block text-[10px] uppercase font-mono text-[#78716C]">
                VHF Field Frequency
              </span>
              <span className="font-mono text-[#1C2526] flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#1F4E43]" /> 147.425 MHz
              </span>
            </div>
            <div className="pt-1">
              <span className="block text-[10px] uppercase font-mono text-[#78716C]">
                Payment Safety Rules
              </span>
              <p className="text-[11px] text-[#64748B] leading-tight">
                We hold your money safely until your mountain tour starts as promised.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial System Telemetry Bar */}
      <div className="border-t border-[#E6E1D8] py-4 px-4 md:px-8 text-[11px] text-[#78716C] font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            © 2026 WeTrek Expeditions Inc. Registered Alpine Outfitter.
          </div>
          <div className="flex items-center gap-4">
            <span>TELEMETRY STATUS: <strong className="text-[#1F4E43]">NOMINAL</strong></span>
            <span>GRID DATUM: <strong>WGS84</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
