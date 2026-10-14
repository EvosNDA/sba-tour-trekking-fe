import React, { useState, useEffect } from 'react';
import { ScreenId } from '../../../types/expedition';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Radio,
  Compass,
  Check,
  Eye,
  EyeOff,
  ArrowRight,
  Send,
  Sparkles,
} from 'lucide-react';

export interface RegisterPageProps {
  onSuccess?: (userData: { name: string; email: string; phone: string }) => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess = () => {},
  onNavigate = () => {},
}) => {
  const [fullName, setFullName] = useState('Maya Lin Harrison');
  const [phoneCountry, setPhoneCountry] = useState('+84');
  const [phoneNumber, setPhoneNumber] = useState('901 234 567');
  const [email, setEmail] = useState('climber@summittrails.com');
  const [isOtpSent, setIsOtpSent] = useState(true);
  const [otpTimer, setOtpTimer] = useState(45);
  const [otpDigits, setOtpDigits] = useState(['8', '4', '1', '9', '0', '2']);
  const [password, setPassword] = useState('AlpineSecure2026!');
  const [confirmPassword, setConfirmPassword] = useState('AlpineSecure2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeRules, setAgreeRules] = useState(true);
  const [agreeWeatherAlerts, setAgreeWeatherAlerts] = useState(true);

  // OTP Countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSendOtp = () => {
    setIsOtpSent(true);
    setOtpTimer(60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      name: fullName,
      email,
      phone: `${phoneCountry} ${phoneNumber}`,
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C2526] py-6 px-4 md:px-8">
      {/* Step Subheader */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C2410C] font-semibold">
        <span className="w-2.5 h-2.5 rounded-full border-2 border-[#C2410C] flex items-center justify-center">
          <span className="w-1 h-1 rounded-full bg-[#C2410C]"></span>
        </span>
        <span>STEP 1 OF 2: CREATE BACKCOUNTRY CLIMBER ACCOUNT</span>
      </div>

      {/* Main Registration Split Container */}
      <div className="max-w-5xl mx-auto bg-white border border-[#E6E1D8] rounded-xl shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 mb-10">
        {/* Left Column: Trust Guarantees */}
        <div className="lg:col-span-5 bg-radial from-[#F2FBFC] to-[#F7F4EE] p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-[#E6E1D8] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#C2410C] font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C]"></span>
              <span>GLOBAL TREK NETWORK</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C2526] mb-3 leading-tight">
              Start Your Mountain Adventure.
            </h1>

            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed mb-8">
              Join over 48,000 verified climbers. Find licensed guides, track mountain weather, and book trail permits with complete safety.
            </p>

            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold block">
                ALPINE TRUST GUARANTEES
              </span>

              <div className="bg-white/80 backdrop-blur-xs border border-[#E6E1D8] rounded-lg p-3.5 flex items-start gap-3 shadow-2xs">
                <div className="w-7 h-7 rounded bg-[#B9EADB]/40 text-[#1F4E43] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C2526] mb-0.5">
                    100% Weather Escrow
                  </h4>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    If bad weather closes the pass, receive a full refund or easy date change.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs border border-[#E6E1D8] rounded-lg p-3.5 flex items-start gap-3 shadow-2xs">
                <div className="w-7 h-7 rounded bg-[#B9EADB]/40 text-[#1F4E43] flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C2526] mb-0.5">
                    Certified Alpine Guides
                  </h4>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    Every guide holds a certified IFMGA or AMGA mountaineering license.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs border border-[#E6E1D8] rounded-lg p-3.5 flex items-start gap-3 shadow-2xs">
                <div className="w-7 h-7 rounded bg-emerald-100 text-[#1F4E43] flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C2526] mb-0.5">
                    24/7 Satellite SOS
                  </h4>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    Continuous emergency telemetry direct to regional mountain rescue teams.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#E6E1D8]/80 text-[11px] text-[#78716C]">
            <p>Certified field operations in Fansipan, Alps, and Andes.</p>
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-white flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E1D8]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#C2410C] font-semibold">
                EXPEDITION ID REGISTRATION
              </span>
              <span className="text-[10px] font-mono text-[#78716C]">
                SECURE SSL 256-BIT
              </span>
            </div>

            <div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2526]">
                Create Your Climber Account
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Simple English registration. Fill in your travel details to book high-mountain expeditions.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-[#1C2526]">Full Legal Name</label>
                <span className="text-[10px] text-[#78716C] font-mono">Required for trail passes</span>
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Lin Harrison"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E6E1D8] rounded text-[#1C2526] focus:bg-white focus:outline-none focus:border-[#C2410C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C2526] mb-1">
                Phone Number <span className="text-[#64748B] font-normal">(For Trail SOS & WhatsApp Updates)</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={phoneCountry}
                  onChange={(e) => setPhoneCountry(e.target.value)}
                  className="bg-[#F7F4EE] border border-[#E6E1D8] text-xs font-semibold px-2.5 py-2 rounded focus:outline-none cursor-pointer"
                >
                  <option value="+84">VN +84 (VN)</option>
                  <option value="+1">US +1 (USA)</option>
                  <option value="+44">UK +44 (GBR)</option>
                  <option value="+61">AU +61 (AUS)</option>
                  <option value="+49">DE +49 (DEU)</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="901 234 567"
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E6E1D8] rounded text-[#1C2526] focus:bg-white focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-[#1C2526] flex items-center gap-1.5">
                  <span>Email Address</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </label>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> Verified
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="climber@domain.com"
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E6E1D8] rounded text-[#1C2526] focus:outline-none focus:border-[#C2410C]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="bg-[#1F4E43] hover:bg-[#15372F] text-white text-xs font-semibold px-3 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>Send OTP</span>
                </button>
              </div>
            </div>

            {isOtpSent && (
              <div className="bg-[#FDFBF7] border border-[#E6E1D8] rounded-lg p-3">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#1C2526] font-mono text-[11px]">
                    ENTER 6-DIGIT EMAIL CODE <span className="text-[#C2410C]">REQUIRED</span>
                  </span>
                  <span className="text-[11px] text-[#78716C]">
                    Code sent to email{' '}
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpTimer > 0}
                      className="text-[#C2410C] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      Resend ({otpTimer}s)
                    </button>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1.5 sm:gap-2 max-w-xs mx-auto mb-2">
                  {otpDigits.map((digit, idx) => (
                    <React.Fragment key={idx}>
                      {idx === 3 && <span className="text-stone-400 font-bold">-</span>}
                      <input
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        className="w-9 h-10 sm:w-10 sm:h-11 text-center font-mono text-base font-bold bg-white border border-[#E6E1D8] rounded focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] focus:outline-none"
                      />
                    </React.Fragment>
                  ))}
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 ml-1">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1C2526] mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pr-8 pl-3 py-2 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E6E1D8] rounded text-[#1C2526] focus:bg-white focus:outline-none focus:border-[#C2410C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C2526] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C2526] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className="w-full pr-8 pl-3 py-2 text-xs sm:text-sm bg-[#F7F4EE] border border-[#E6E1D8] rounded text-[#1C2526] focus:bg-white focus:outline-none focus:border-[#C2410C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C2526] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreeRules}
                  onChange={(e) => setAgreeRules(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-[#C2410C] focus:ring-[#C2410C]"
                />
                <span className="text-[#2D3748] leading-tight">
                  I agree to the <strong className="text-[#1C2526]">Mountain Safety Rules</strong> and Backcountry Escrow Policy.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeWeatherAlerts}
                  onChange={(e) => setAgreeWeatherAlerts(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-[#C2410C] focus:ring-[#C2410C]"
                />
                <span className="text-[#2D3748] leading-tight">
                  Send trail weather warnings and permit reminders to my WhatsApp &amp; SMS.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#C2410C] hover:bg-[#9B2F00] text-white py-3 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
            >
              <span>Complete Registration &amp; Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs text-[#64748B] pt-2">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="hover:text-[#1C2526] cursor-pointer"
              >
                Already a climber? <strong className="text-[#1C2526] underline">Sign In here</strong>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="hover:text-[#1C2526] cursor-pointer"
              >
                Are you a guide? <span className="text-[#C2410C] font-semibold">Register as Partner -&gt;</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
