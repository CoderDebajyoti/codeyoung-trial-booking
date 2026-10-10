import React, { useState, useEffect } from 'react';
import { Lock, Mail, KeyRound, Loader2, AlertCircle, ShieldCheck, X, User, CheckCircle2 } from 'lucide-react';
import { api, AuthUser } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'parent' | 'mentor';
  onClose: () => void;
  onLoginSuccess: (user: AuthUser, type: 'parent' | 'mentor') => void;
}

export function AuthModal({
  isOpen,
  initialTab = 'parent',
  onClose,
  onLoginSuccess,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'parent' | 'mentor'>(initialTab);

  // Parent Login Form State
  const [parentEmail, setParentEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentOtp, setParentOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingParent, setIsVerifyingParent] = useState(false);
  const [parentSuccessMsg, setParentSuccessMsg] = useState<string | null>(null);
  const [parentError, setParentError] = useState<string | null>(null);

  // Mentor Login Form State
  const [mentorEmail, setMentorEmail] = useState('aarav.sharma@codeyoung.com');
  const [mentorPassword, setMentorPassword] = useState('Mentor@Codeyoung2026!');
  const [isMentorLoading, setIsMentorLoading] = useState(false);
  const [mentorError, setMentorError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setParentError(null);
      setMentorError(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Parent OTP Send
  const handleSendParentOtp = async () => {
    if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      setParentError('Please enter a valid parent email address.');
      return;
    }

    setIsSendingOtp(true);
    setParentError(null);
    setParentSuccessMsg(null);

    try {
      const res = await api.sendOtp(parentEmail, 'test-captcha-token');
      setIsOtpSent(true);
      setParentSuccessMsg(res.message || 'Verification code sent to your email.');
    } catch (err: any) {
      setParentError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Parent Login / Verify
  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentEmail) {
      setParentError('Please enter your email address.');
      return;
    }

    setIsVerifyingParent(true);
    setParentError(null);

    try {
      if (isOtpSent && parentOtp.length === 6) {
        await api.verifyOtp(parentEmail, parentOtp);
        const parentUser: AuthUser = {
          id: `parent_${Math.random().toString(36).substring(2, 7)}`,
          name: parentName || parentEmail.split('@')[0] || 'Parent',
          email: parentEmail,
          role: 'PARENT' as any,
        };
        onLoginSuccess(parentUser, 'parent');
        onClose();
      } else {
        // Direct parent sign in / session initiation
        const parentUser: AuthUser = {
          id: `parent_${Math.random().toString(36).substring(2, 7)}`,
          name: parentName || parentEmail.split('@')[0] || 'Parent',
          email: parentEmail,
          role: 'PARENT' as any,
        };
        onLoginSuccess(parentUser, 'parent');
        onClose();
      }
    } catch (err: any) {
      setParentError(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsVerifyingParent(false);
    }
  };

  // Handle Mentor Login
  const handleMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorEmail || !mentorPassword) {
      setMentorError('Please enter both email and password.');
      return;
    }

    setIsMentorLoading(true);
    setMentorError(null);

    try {
      const { user } = await api.login(mentorEmail, mentorPassword, 'test-captcha-token');
      onLoginSuccess(user, 'mentor');
      onClose();
    } catch (err: any) {
      setMentorError(err?.message || 'Invalid mentor credentials.');
    } finally {
      setIsMentorLoading(false);
    }
  };

  const handleQuickFillMentor = (demoEmail: string, demoPass: string) => {
    setMentorEmail(demoEmail);
    setMentorPassword(demoPass);
    setMentorError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#713B18]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#F7E4B6] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with Signature Gradient */}
        <div className="bg-gradient-to-r from-[#FFD45A] via-[#FFC52E] to-[#FFB82E] p-6 text-[#713B18] border-b border-[#F7E4B6] relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/40 hover:bg-white/70 text-[#713B18] transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/40 text-[#713B18] text-xs font-extrabold backdrop-blur-xs mb-2 border border-white/50">
            <ShieldCheck className="w-3.5 h-3.5 text-[#843B13]" /> Codeyoung Authentication
          </div>
          
          <h3 className="text-xl font-heading font-extrabold text-[#713B18]">
            {activeTab === 'parent' ? 'Parent Portal Access' : 'Mentor & Admin Access'}
          </h3>
          <p className="text-[#843B13] text-xs mt-1 font-semibold">
            {activeTab === 'parent'
              ? 'Sign in to view your student bookings, eligibility, and personalized schedule.'
              : 'Sign in with your company-issued credentials to view authorized schedules.'}
          </p>
        </div>

        {/* Tab Switcher: Parent Login vs Mentor Login */}
        <div className="flex border-b border-[#F7E4B6] bg-[#FFF8E8]/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('parent')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'parent'
                ? 'btn-primary-gradient text-[#713B18] shadow-sm'
                : 'text-[#713B18]/70 hover:text-[#713B18]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Parent Login</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mentor')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'mentor'
                ? 'btn-primary-gradient text-[#713B18] shadow-sm'
                : 'text-[#713B18]/70 hover:text-[#713B18]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Mentor Login</span>
          </button>
        </div>

        {/* Parent Login Tab Content */}
        {activeTab === 'parent' && (
          <form onSubmit={handleParentSubmit} className="p-6 space-y-4">
            {parentError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-bold">{parentError}</span>
              </div>
            )}
            {parentSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{parentSuccessMsg}</span>
              </div>
            )}

            {/* Parent Full Name (Optional) */}
            <div>
              <label htmlFor="parentNameInput" className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-1.5">
                Parent Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="parentNameInput"
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-xs font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Parent Email */}
            <div>
              <label htmlFor="parentEmailInput" className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-1.5">
                Parent Email Address <span className="text-[#F28C28]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="parentEmailInput"
                  type="email"
                  required
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-xs font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all"
                />
              </div>
              <div className="mt-1.5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSendParentOtp}
                  disabled={isSendingOtp}
                  className="text-[11px] font-bold text-[#F28C28] hover:text-[#713B18] cursor-pointer underline"
                >
                  {isSendingOtp ? 'Sending code...' : '🔐 Send Email Verification Code'}
                </button>
              </div>
            </div>

            {/* OTP Code (If Sent) */}
            {isOtpSent && (
              <div>
                <label htmlFor="parentOtpInput" className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-1.5">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="parentOtpInput"
                    type="text"
                    maxLength={6}
                    value={parentOtp}
                    onChange={(e) => setParentOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#F7E4B6] bg-white text-xs font-mono font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isVerifyingParent}
                className="btn-primary-gradient w-full py-3.5 px-5 text-sm font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
              >
                {isVerifyingParent ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#713B18]" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#713B18]" />
                    <span>Continue to Booking Portal</span>
                  </>
                )}
              </button>
            </div>

            {/* Switch to Mentor Login link */}
            <div className="text-center pt-2">
              <span className="text-xs text-[#713B18]/70">Are you a Codeyoung mentor? </span>
              <button
                type="button"
                onClick={() => setActiveTab('mentor')}
                className="text-xs font-extrabold text-[#F28C28] hover:underline cursor-pointer"
              >
                Mentor Login →
              </button>
            </div>
          </form>
        )}

        {/* Mentor Login Tab Content */}
        {activeTab === 'mentor' && (
          <form onSubmit={handleMentorSubmit} className="p-6 space-y-4">
            {mentorError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-bold">{mentorError}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="mentorEmailInput" className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-1.5">
                Company Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="mentorEmailInput"
                  type="email"
                  required
                  value={mentorEmail}
                  onChange={(e) => setMentorEmail(e.target.value)}
                  placeholder="mentor@codeyoung.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-xs font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="mentorPasswordInput" className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="mentorPasswordInput"
                  type="password"
                  required
                  value={mentorPassword}
                  onChange={(e) => setMentorPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-xs font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Quick Demo Credentials Helper */}
            <div className="pt-1 pb-1">
              <span className="text-[11px] font-bold text-[#843B13] block mb-1.5">
                ⚡ Company Demo Accounts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFillMentor('aarav.sharma@codeyoung.com', 'Mentor@Codeyoung2026!')}
                  className="px-2.5 py-1 rounded-xl bg-[#FFF0D2] border border-[#F7E4B6] text-[11px] font-extrabold text-[#713B18] hover:bg-[#FFE5B4] cursor-pointer"
                >
                  Aarav (Mentor)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillMentor('sarah.johnson@codeyoung.com', 'Mentor@Codeyoung2026!')}
                  className="px-2.5 py-1 rounded-xl bg-[#FFF0D2] border border-[#F7E4B6] text-[11px] font-extrabold text-[#713B18] hover:bg-[#FFE5B4] cursor-pointer"
                >
                  Sarah (Mentor)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillMentor('admin@codeyoung.com', 'Admin@Codeyoung2026!')}
                  className="px-2.5 py-1 rounded-xl bg-[#FFE5B4] border border-[#F28C28] text-[11px] font-extrabold text-[#843B13] hover:bg-[#FFD45A] cursor-pointer"
                >
                  Admin (System)
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isMentorLoading}
                className="btn-primary-gradient w-full py-3.5 px-5 text-sm font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
              >
                {isMentorLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#713B18]" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#713B18]" />
                    <span>Sign In to Mentor Portal</span>
                  </>
                )}
              </button>
            </div>

            {/* Switch to Parent Login link */}
            <div className="text-center pt-2">
              <span className="text-xs text-[#713B18]/70">Booking for your child? </span>
              <button
                type="button"
                onClick={() => setActiveTab('parent')}
                className="text-xs font-extrabold text-[#F28C28] hover:underline cursor-pointer"
              >
                Parent Login →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
