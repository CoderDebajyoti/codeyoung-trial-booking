import React, { useState } from 'react';
import {
  Code,
  Calculator,
  Atom,
  BookOpen,
  Bot,
  Coins,
  Sparkles,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Compass,
  Lightbulb,
  Award,
  Layers,
} from 'lucide-react';
import { CodeyoungLogo } from './CodeyoungLogo';
import { api, AuthUser } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, type: 'parent' | 'mentor') => void;
  onNavigateToBooking: () => void;
}

export const SUBJECTS = [
  {
    name: 'Coding',
    icon: Code,
    description: 'Scratch, Python, Web Apps & Game Logic',
    tag: 'Ages 6-16',
  },
  {
    name: 'Math',
    icon: Calculator,
    description: 'Mental Math, Olympiads & Logic',
    tag: 'Ages 5-15',
  },
  {
    name: 'Science',
    icon: Atom,
    description: 'Physics, Chemistry & Biology Inquiries',
    tag: 'Ages 8-16',
  },
  {
    name: 'English',
    icon: BookOpen,
    description: 'Creative Writing, Grammar & Speech',
    tag: 'Ages 6-14',
  },
  {
    name: 'Robotics',
    icon: Bot,
    description: 'Sensors, Circuitry & Micro:bit Kits',
    tag: 'Ages 8-16',
  },
  {
    name: 'Finance',
    icon: Coins,
    description: 'Money Habits, Budgeting & Smart Investing',
    tag: 'Ages 9-16',
  },
];

export const FEATURES = [
  {
    title: 'Interactive learning',
    description: 'Live 1:1 dynamic sessions tailored to your child’s pace and learning style.',
    icon: Compass,
  },
  {
    title: 'Personal mentor guidance',
    description: 'Dedicated educators certified in modern pedagogy and STEM concepts.',
    icon: Award,
  },
  {
    title: 'Creative problem-solving',
    description: 'Challenging real-world projects that turn theoretical concepts into tangible skills.',
    icon: Lightbulb,
  },
  {
    title: 'Learning through projects',
    description: 'Hands-on creation of playable games, mobile apps, and interactive models.',
    icon: Layers,
  },
];

export function LoginPage({ onLoginSuccess, onNavigateToBooking }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<'parent' | 'mentor'>('parent');

  // Parent form state
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [parentOtp, setParentOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isParentSubmitting, setIsParentSubmitting] = useState(false);
  const [parentError, setParentError] = useState<string | null>(null);
  const [parentSuccessMsg, setParentSuccessMsg] = useState<string | null>(null);

  // Mentor form state
  const [mentorEmail, setMentorEmail] = useState('aarav.sharma@codeyoung.com');
  const [mentorPassword, setMentorPassword] = useState('Mentor@Codeyoung2026!');
  const [showMentorPassword, setShowMentorPassword] = useState(false);
  const [isMentorSubmitting, setIsMentorSubmitting] = useState(false);
  const [mentorError, setMentorError] = useState<string | null>(null);

  // Parent Login Submission
  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      setParentError('Please enter a valid parent email address.');
      return;
    }

    setIsParentSubmitting(true);
    setParentError(null);

    try {
      if (useOtpLogin && isOtpSent) {
        if (!parentOtp || parentOtp.trim().length !== 6) {
          setParentError('Please enter the 6-digit verification code.');
          setIsParentSubmitting(false);
          return;
        }
        await api.verifyOtp(parentEmail, parentOtp);
        const parentUser: AuthUser = {
          id: `parent_${Math.random().toString(36).substring(2, 7)}`,
          name: parentEmail.split('@')[0] || 'Parent',
          email: parentEmail,
          role: 'PARENT' as any,
        };
        onLoginSuccess(parentUser, 'parent');
      } else {
        // Parent Password login / session initiation
        const parentUser: AuthUser = {
          id: `parent_${Math.random().toString(36).substring(2, 7)}`,
          name: parentEmail.split('@')[0] || 'Parent',
          email: parentEmail,
          role: 'PARENT' as any,
        };
        onLoginSuccess(parentUser, 'parent');
      }
    } catch (err: any) {
      setParentError(err?.message || 'Login failed. Please verify your details.');
    } finally {
      setIsParentSubmitting(false);
    }
  };

  // Send Parent OTP
  const handleSendParentOtp = async () => {
    if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      setParentError('Please enter a valid email address first.');
      return;
    }

    setIsSendingOtp(true);
    setParentError(null);
    setParentSuccessMsg(null);

    try {
      const res = await api.sendOtp(parentEmail, 'test-captcha-token');
      setIsOtpSent(true);
      setUseOtpLogin(true);
      setParentSuccessMsg(res.message || 'Verification code sent to your email.');
    } catch (err: any) {
      setParentError(err?.message || 'Failed to send OTP code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Mentor Login Submission
  const handleMentorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorEmail || !mentorPassword) {
      setMentorError('Please enter company email and password.');
      return;
    }

    setIsMentorSubmitting(true);
    setMentorError(null);

    try {
      const { user } = await api.login(mentorEmail, mentorPassword, 'test-captcha-token');
      onLoginSuccess(user, 'mentor');
    } catch (err: any) {
      setMentorError(err?.message || 'Invalid company credentials.');
    } finally {
      setIsMentorSubmitting(false);
    }
  };

  const handleQuickFillMentor = (email: string, pass: string) => {
    setMentorEmail(email);
    setMentorPassword(pass);
    setMentorError(null);
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: Original Educational Promotional Panel (~68%) */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-gradient-to-br from-[#FFF8E8] via-white to-[#FFF0D2]/60 rounded-3xl border border-[#F7E4B6] p-6 sm:p-8 lg:p-10 shadow-card-warm relative overflow-hidden">
          
          {/* Subtle Ambient Background Accents */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#FFD45A]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#F28C28]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            {/* Top Brand Tagline */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CodeyoungLogo />
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#FFF0D2] text-[#843B13] border border-[#F7E4B6]">
                  <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
                  Global 1:1 Learning Platform
                </span>
              </div>
              <button
                onClick={onNavigateToBooking}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#843B13] hover:text-[#713B18] px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#F7E4B6] shadow-xs cursor-pointer transition-all"
              >
                <span>Book Free Trial Class</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F28C28]" />
              </button>
            </div>

            {/* Main Headline & Supporting Text */}
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD45A]/50 border border-[#FFB82E]/40 text-[#713B18] text-xs font-extrabold">
                <Sparkles className="w-3.5 h-3.5 text-[#843B13]" />
                Personalized 1:1 Live Education
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#713B18] tracking-tight leading-tight">
                Big ideas start with curious minds.
              </h1>
              <p className="text-sm sm:text-base text-[#843B13] font-semibold leading-relaxed">
                Discover interactive classes designed to help children explore, build skills, and grow with confidence.
              </p>
            </div>

            {/* Subject Pillars Grid (The 6 Exact Subjects) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#713B18]">
                  Explore Our 6 Core Disciplines
                </h3>
                <span className="text-[11px] font-bold text-[#843B13]">Ages 5–16</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {SUBJECTS.map((sub) => {
                  const Icon = sub.icon;
                  return (
                    <div
                      key={sub.name}
                      className="group p-3.5 rounded-2xl bg-white/85 hover:bg-white border border-[#F7E4B6] hover:border-[#FFB82E] shadow-xs hover:shadow-sm transition-all duration-200 text-left"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FFD45A] to-[#FFB82E] flex items-center justify-center text-[#713B18] shadow-xs group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold text-[#843B13] bg-[#FFF0D2] px-2 py-0.5 rounded-full border border-[#F7E4B6]">
                          {sub.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-heading font-extrabold text-[#713B18]">
                        {sub.name}
                      </h4>
                      <p className="text-[11px] text-[#713B18]/70 font-semibold line-clamp-1 mt-0.5">
                        {sub.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4 Feature Cards */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-3">
                Why Parents & Students Choose Codeyoung
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURES.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.title}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/70 border border-[#F7E4B6]/80 text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#FFF0D2] border border-[#F7E4B6] flex items-center justify-center text-[#F28C28] shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-extrabold text-[#713B18]">
                          {feat.title}
                        </h5>
                        <p className="text-[11px] text-[#713B18]/75 font-medium leading-normal mt-0.5">
                          {feat.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Promotional Footer */}
          <div className="relative z-10 pt-6 mt-6 border-t border-[#F7E4B6]/80 flex flex-wrap items-center justify-between gap-3 text-xs text-[#713B18]/70">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified 1:1 Live Instruction • Zero Group Confusion</span>
            </div>
            <span className="text-[11px] font-bold text-[#843B13]">
              30-Minute Complimentary Class
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Compact Authentication Panel (~32%) */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 flex flex-col justify-center">
          <div className="w-full bg-white rounded-3xl border border-[#F7E4B6] shadow-card-warm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header with Warm Gradient */}
            <div className="bg-gradient-to-r from-[#FFD45A] via-[#FFC52E] to-[#FFB82E] p-5 text-[#713B18] border-b border-[#F7E4B6]">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/40 text-[#713B18] text-[11px] font-extrabold backdrop-blur-xs mb-1.5 border border-white/50">
                <ShieldCheck className="w-3 h-3 text-[#843B13]" /> Secure Login
              </div>
              <h2 className="text-xl font-heading font-extrabold text-[#713B18]">
                {activeTab === 'parent' ? 'Parent Sign In' : 'Mentor Portal Sign In'}
              </h2>
              <p className="text-[#843B13] text-xs font-semibold mt-0.5">
                {activeTab === 'parent'
                  ? 'Access your child’s bookings, schedules & progress'
                  : 'Company credentials for active STEM mentors'}
              </p>
            </div>

            {/* Tab Switcher: Parent Login vs Mentor Login */}
            <div className="flex border-b border-[#F7E4B6] bg-[#FFF8E8]/70 p-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('parent');
                  setParentError(null);
                  setMentorError(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'parent'
                    ? 'btn-primary-gradient text-[#713B18] shadow-xs'
                    : 'text-[#713B18]/70 hover:text-[#713B18]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Parent Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('mentor');
                  setParentError(null);
                  setMentorError(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'mentor'
                    ? 'btn-primary-gradient text-[#713B18] shadow-xs'
                    : 'text-[#713B18]/70 hover:text-[#713B18]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Mentor Login</span>
              </button>
            </div>

            {/* PARENT LOGIN FORM */}
            {activeTab === 'parent' && (
              <form onSubmit={handleParentLogin} className="p-5 space-y-4">
                {parentError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-bold">{parentError}</span>
                  </div>
                )}
                {parentSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">{parentSuccessMsg}</span>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="parentLoginEmail"
                    className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-1.5"
                  >
                    Parent Email Address <span className="text-[#F28C28]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#F28C28]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="parentLoginEmail"
                      type="email"
                      required
                      value={parentEmail}
                      onChange={(e) => {
                        setParentEmail(e.target.value);
                        setParentError(null);
                      }}
                      placeholder="parent@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-xs font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all placeholder:text-[#713B18]/40"
                    />
                  </div>
                </div>

                {/* Password / OTP Input */}
                {!useOtpLogin ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="parentLoginPassword"
                        className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18]"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleSendParentOtp}
                        disabled={isSendingOtp}
                        className="text-[11px] font-bold text-[#F28C28] hover:text-[#713B18] cursor-pointer underline"
                      >
                        {isSendingOtp ? 'Sending code...' : 'Use Email OTP instead'}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#F28C28]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="parentLoginPassword"
                        type={showParentPassword ? 'text' : 'password'}
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-xs font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all placeholder:text-[#713B18]/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowParentPassword(!showParentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#843B13]/70 hover:text-[#713B18] cursor-pointer"
                        aria-label={showParentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showParentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="parentLoginOtp"
                        className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18]"
                      >
                        6-Digit Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseOtpLogin(false)}
                        className="text-[11px] font-bold text-[#F28C28] hover:text-[#713B18] cursor-pointer underline"
                      >
                        Use password
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#F28C28]">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        id="parentLoginOtp"
                        type="text"
                        maxLength={6}
                        value={parentOtp}
                        onChange={(e) => setParentOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#F7E4B6] bg-white text-xs font-mono font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Primary Sign In Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isParentSubmitting}
                    className="btn-primary-gradient w-full py-3 px-4 text-xs font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
                  >
                    {isParentSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#713B18]" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-[#713B18]" />
                        <span>Sign In to Parent Account</span>
                      </>
                    )}
                  </button>
                </div>

                {/* New Parent Registration / Trial Booking CTA */}
                <div className="pt-3 border-t border-[#F7E4B6] space-y-2 text-center">
                  <div className="text-xs text-[#713B18]/80 font-semibold">
                    Don't have a parent account yet?
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToBooking}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#FFF0D2] hover:bg-[#FFE4B5] border border-[#F7E4B6] text-xs font-extrabold text-[#843B13] hover:text-[#713B18] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>🎯 Book a Free 1:1 Trial Class</span>
                  </button>
                </div>

                {/* Switch to Mentor Login footer link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('mentor')}
                    className="text-xs font-bold text-[#F28C28] hover:text-[#713B18] underline cursor-pointer"
                  >
                    Switch to Mentor Login →
                  </button>
                </div>
              </form>
            )}

            {/* MENTOR LOGIN FORM */}
            {activeTab === 'mentor' && (
              <form onSubmit={handleMentorLogin} className="p-5 space-y-4">
                {mentorError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-bold">{mentorError}</span>
                  </div>
                )}

                {/* Company Email */}
                <div>
                  <label
                    htmlFor="mentorLoginEmail"
                    className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-1.5"
                  >
                    Company Email <span className="text-[#F28C28]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#F28C28]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="mentorLoginEmail"
                      type="email"
                      required
                      value={mentorEmail}
                      onChange={(e) => setMentorEmail(e.target.value)}
                      placeholder="mentor@codeyoung.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-xs font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all placeholder:text-[#713B18]/40"
                    />
                  </div>
                </div>

                {/* Mentor Password */}
                <div>
                  <label
                    htmlFor="mentorLoginPassword"
                    className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-1.5"
                  >
                    Password <span className="text-[#F28C28]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#F28C28]">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="mentorLoginPassword"
                      type={showMentorPassword ? 'text' : 'password'}
                      required
                      value={mentorPassword}
                      onChange={(e) => setMentorPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-xs font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all placeholder:text-[#713B18]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMentorPassword(!showMentorPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#843B13]/70 hover:text-[#713B18] cursor-pointer"
                      aria-label={showMentorPassword ? 'Hide password' : 'Show password'}
                    >
                      {showMentorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Demo Accounts Helper */}
                <div className="pt-0.5 pb-0.5">
                  <span className="text-[11px] font-bold text-[#843B13] block mb-1">
                    ⚡ Demo Mentor Accounts:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickFillMentor('aarav.sharma@codeyoung.com', 'Mentor@Codeyoung2026!')}
                      className="px-2 py-1 rounded-lg bg-[#FFF0D2] border border-[#F7E4B6] text-[10px] font-extrabold text-[#713B18] hover:bg-[#FFE5B4] cursor-pointer"
                    >
                      Aarav (Mentor)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFillMentor('sarah.johnson@codeyoung.com', 'Mentor@Codeyoung2026!')}
                      className="px-2 py-1 rounded-lg bg-[#FFF0D2] border border-[#F7E4B6] text-[10px] font-extrabold text-[#713B18] hover:bg-[#FFE5B4] cursor-pointer"
                    >
                      Sarah (Mentor)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFillMentor('admin@codeyoung.com', 'Admin@Codeyoung2026!')}
                      className="px-2 py-1 rounded-lg bg-[#FFE5B4] border border-[#F28C28] text-[10px] font-extrabold text-[#843B13] hover:bg-[#FFD45A] cursor-pointer"
                    >
                      Admin (System)
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isMentorSubmitting}
                    className="btn-primary-gradient w-full py-3 px-4 text-xs font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
                  >
                    {isMentorSubmitting ? (
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

                {/* Switch to Parent Login footer link */}
                <div className="text-center pt-2 border-t border-[#F7E4B6]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('parent')}
                    className="text-xs font-bold text-[#F28C28] hover:text-[#713B18] underline cursor-pointer"
                  >
                    ← Switch to Parent Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
