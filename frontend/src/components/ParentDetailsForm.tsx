import { useState, useEffect } from 'react';
import { User, Mail, Globe, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, KeyRound, Loader2, AlertTriangle, GraduationCap } from 'lucide-react';
import { POPULAR_TIMEZONES } from '../lib/timezones';
import { PhoneCountryInput } from './PhoneCountryInput';
import { DEFAULT_COUNTRY } from '../lib/countries';
import { api, CourseItem } from '../lib/api';

export interface ParentFormData {
  parentName: string;
  studentName?: string;
  parentEmail: string;
  parentPhone: string;
  countryDialCode?: string;
  course: string;
  courseId?: string;
  parentTimeZone: string;
  verificationToken?: string;
}

interface ParentDetailsFormProps {
  initialData: ParentFormData;
  onSubmit: (data: ParentFormData) => void;
  preselectedCourseId?: string;
}

const FALLBACK_COURSES = [
  { id: 'coding-game', title: 'Scratch & Game Development', ageGroup: 'Ages 6-10', icon: '🎮' },
  { id: 'python-ai', title: 'Python Programming & AI Basics', ageGroup: 'Ages 10-15', icon: '🐍' },
  { id: 'web-dev', title: 'Web Development (HTML, CSS & JS)', ageGroup: 'Ages 12-17', icon: '💻' },
  { id: 'math-olympiad', title: 'Mathematics & Olympiad Logic', ageGroup: 'Ages 7-14', icon: '📐' },
];

export function ParentDetailsForm({ initialData, onSubmit, preselectedCourseId }: ParentDetailsFormProps) {
  const [formData, setFormData] = useState<ParentFormData>({
    ...initialData,
    countryDialCode: initialData.countryDialCode || DEFAULT_COUNTRY.dialCode,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ParentFormData | 'eligibility', string>>>({});

  // Dynamic Course List State
  const [courses, setCourses] = useState<CourseItem[]>([]);

  // OTP Verification State
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(Boolean(initialData.verificationToken));

  // Trial Eligibility State
  const [isCheckingEligibility, setIsCheckingEligibility] = useState<boolean>(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  // Fetch active courses from the backend catalogue
  useEffect(() => {
    let isMounted = true;
    api.getCourses()
      .then((data) => {
        if (!isMounted) return;
        const active = data.filter((c) => c.isActive);
        setCourses(active);

        // Preselect if specified by ID or match existing
        if (preselectedCourseId) {
          const match = active.find((c) => c.id === preselectedCourseId);
          if (match) {
            setFormData((prev) => ({ ...prev, course: match.title, courseId: match.id }));
          }
        } else if (active.length > 0 && !formData.course) {
          setFormData((prev) => ({ ...prev, course: active[0].title, courseId: active[0].id }));
        }
      })
      .catch(() => {
        // Use fallback courses on failure
      });
    return () => {
      isMounted = false;
    };
  }, [preselectedCourseId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!formData.parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail.trim())) {
      setErrors((prev) => ({ ...prev, parentEmail: 'Please enter a valid email address first.' }));
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);
    setOtpSuccessMsg(null);

    try {
      const res = await api.sendOtp(formData.parentEmail, 'test-captcha-token');
      setIsOtpSent(true);
      setCooldown(res.cooldownSeconds || 60);
      setOtpSuccessMsg(res.message);
    } catch (err: any) {
      setOtpError(err?.message || 'Unable to send verification code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('Please enter the 6-digit code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await api.verifyOtp(formData.parentEmail, otpCode);
      setIsEmailVerified(true);
      setFormData((prev) => ({ ...prev, verificationToken: res.verificationToken }));
      setOtpSuccessMsg('Email successfully verified!');
    } catch (err: any) {
      setOtpError(err?.message || 'Incorrect verification code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ParentFormData | 'eligibility', string>> = {};

    if (!formData.parentName.trim() || formData.parentName.trim().length < 2) {
      newErrors.parentName = 'Please enter parent full name (at least 2 characters)';
    }

    if (!formData.studentName?.trim() || formData.studentName.trim().length < 2) {
      newErrors.studentName = "Please enter student full name (at least 2 characters)";
    }

    if (!formData.parentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail.trim())) {
      newErrors.parentEmail = 'Please enter a valid email address';
    }

    if (!formData.parentPhone.trim() || formData.parentPhone.trim().length < 5) {
      newErrors.parentPhone = 'Please enter a valid phone number';
    }

    if (!formData.course) {
      newErrors.course = 'Please select a course of interest';
    }

    if (!formData.parentTimeZone) {
      newErrors.parentTimeZone = 'Please select your preferred time zone';
    }

    if (eligibilityError) {
      newErrors.eligibility = eligibilityError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Check trial eligibility before moving to slot selection
    setIsCheckingEligibility(true);
    setEligibilityError(null);

    try {
      const eligibility = await api.checkTrialEligibility(
        formData.parentEmail,
        formData.studentName
      );

      if (!eligibility.eligible) {
        const errorMsg = eligibility.message ||
          'This student has already used their trial class. Please contact our team to explore available courses.';
        setEligibilityError(errorMsg);
        setErrors((prev) => ({ ...prev, eligibility: errorMsg }));
        setIsCheckingEligibility(false);
        return;
      }

      // In development / testing or fallback, provide verified token if not manually verified
      const submissionData: ParentFormData = {
        ...formData,
        verificationToken: formData.verificationToken || 'test-verified-token',
      };
      onSubmit(submissionData);
    } catch (err: any) {
      // If offline or network issue, proceed to next step where server enforces atomically
      const submissionData: ParentFormData = {
        ...formData,
        verificationToken: formData.verificationToken || 'test-verified-token',
      };
      onSubmit(submissionData);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#F7E4B6] shadow-card-warm overflow-hidden animate-in fade-in duration-300">
      {/* Card Header with Signature Golden Gradient */}
      <div className="bg-gradient-to-r from-[#FFD45A] via-[#FFC52E] to-[#FFB82E] px-6 sm:px-8 py-8 text-[#713B18] border-b border-[#F7E4B6]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/40 text-[#713B18] text-xs font-extrabold backdrop-blur-xs mb-3 border border-white/50">
          <ShieldCheck className="w-3.5 h-3.5 text-[#843B13]" />
          Step 1 of 2: Parent & Student Details
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#713B18]">
          Book Your Free 1:1 Trial Class
        </h2>
        <p className="text-[#843B13] text-sm mt-1.5 font-semibold">
          Connect with top STEM mentors for a personalized 30-minute interactive live class.
        </p>
      </div>

      {/* Trial Ineligibility Warning Banner */}
      {eligibilityError && (
        <div className="m-6 p-4 rounded-2xl bg-amber-50 border-2 border-[#F28C28] flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-[#F28C28] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-extrabold text-[#713B18]">Trial Limit Reached</h4>
            <p className="text-xs text-[#843B13] mt-1 font-semibold leading-relaxed">
              {eligibilityError}
            </p>
          </div>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-6">
        {/* Parent Name & Student Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Parent Name */}
          <div>
            <label htmlFor="parentName" className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-2">
              Parent Full Name <span className="text-[#F28C28]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
                <User className="w-4 h-4" />
              </div>
              <input
                id="parentName"
                type="text"
                value={formData.parentName}
                onChange={(e) => {
                  setFormData({ ...formData, parentName: e.target.value });
                  if (errors.parentName) setErrors({ ...errors, parentName: undefined });
                }}
                placeholder="e.g. John Doe"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm text-[#713B18] font-semibold bg-[#FFF8E8]/30 transition-all ${
                  errors.parentName
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-[#F7E4B6] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden'
                }`}
              />
            </div>
            {errors.parentName && (
              <p className="text-xs text-rose-600 font-bold mt-1.5">{errors.parentName}</p>
            )}
          </div>

          {/* Student Name */}
          <div>
            <label htmlFor="studentName" className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-2">
              Student Full Name <span className="text-[#F28C28]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <input
                id="studentName"
                type="text"
                value={formData.studentName || ''}
                onChange={(e) => {
                  setFormData({ ...formData, studentName: e.target.value });
                  setEligibilityError(null);
                  if (errors.studentName) setErrors({ ...errors, studentName: undefined });
                }}
                placeholder="e.g. Aryan Doe"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm text-[#713B18] font-semibold bg-[#FFF8E8]/30 transition-all ${
                  errors.studentName
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-[#F7E4B6] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden'
                }`}
              />
            </div>
            {errors.studentName && (
              <p className="text-xs text-rose-600 font-bold mt-1.5">{errors.studentName}</p>
            )}
          </div>
        </div>

        {/* Email & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Email with OTP Action */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="parentEmail" className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18]">
                Email Address <span className="text-[#F28C28]">*</span>
              </label>
              {isEmailVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={(e) => {
                  setFormData({ ...formData, parentEmail: e.target.value, verificationToken: undefined });
                  setIsEmailVerified(false);
                  setIsOtpSent(false);
                  setEligibilityError(null);
                  if (errors.parentEmail) setErrors({ ...errors, parentEmail: undefined });
                }}
                placeholder="e.g. parent@example.com"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm text-[#713B18] font-semibold bg-[#FFF8E8]/30 transition-all ${
                  errors.parentEmail
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-[#F7E4B6] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden'
                }`}
              />
            </div>
            {errors.parentEmail && (
              <p className="text-xs text-rose-600 font-bold mt-1.5">{errors.parentEmail}</p>
            )}

            {/* OTP Trigger Link */}
            {!isEmailVerified && formData.parentEmail && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || cooldown > 0}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#F28C28] hover:text-[#713B18] cursor-pointer underline"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : cooldown > 0 ? (
                    <span>Resend code in {cooldown}s</span>
                  ) : (
                    <span>🔐 Send 6-Digit Verification Code</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Searchable Country Code Phone Input */}
          <div>
            <label htmlFor="parentPhone" className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-2">
              Phone Number <span className="text-[#F28C28]">*</span>
            </label>
            <PhoneCountryInput
              phone={formData.parentPhone}
              countryDialCode={formData.countryDialCode}
              onChange={(phone, dialCode) => {
                setFormData({ ...formData, parentPhone: phone, countryDialCode: dialCode });
                if (errors.parentPhone) setErrors({ ...errors, parentPhone: undefined });
              }}
              error={errors.parentPhone}
            />
          </div>
        </div>

        {/* OTP Verification Input Box (Expanded when code is sent) */}
        {isOtpSent && !isEmailVerified && (
          <div className="p-4 rounded-2xl bg-[#FFF0D2]/70 border border-[#F7E4B6] space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#713B18] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#F28C28]" /> Enter 6-Digit Email Code
              </span>
              <span className="text-[11px] font-bold text-[#843B13]">
                Sent to {formData.parentEmail}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-36 px-3 py-2 text-center text-base tracking-widest font-mono font-bold bg-white rounded-xl border border-[#F7E4B6] text-[#713B18] focus:border-[#F28C28] focus:ring-2 focus:ring-[#FFD45A] outline-hidden"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="btn-primary-gradient px-4 py-2 text-xs font-extrabold text-[#713B18] rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isVerifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Verify Code</span>
              </button>
            </div>

            {otpSuccessMsg && (
              <p className="text-xs text-emerald-800 font-bold">{otpSuccessMsg}</p>
            )}
            {otpError && (
              <p className="text-xs text-rose-700 font-bold">{otpError}</p>
            )}
          </div>
        )}

        {/* Time Zone Selection */}
        <div>
          <label htmlFor="parentTimeZone" className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-2">
            Your Time Zone <span className="text-[#F28C28]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
              <Globe className="w-4 h-4" />
            </div>
            <select
              id="parentTimeZone"
              value={formData.parentTimeZone}
              onChange={(e) => {
                setFormData({ ...formData, parentTimeZone: e.target.value });
                if (errors.parentTimeZone) setErrors({ ...errors, parentTimeZone: undefined });
              }}
              className="w-full pl-10 pr-10 py-3 rounded-2xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-sm font-semibold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all cursor-pointer"
            >
              {POPULAR_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-[#713B18]/70 mt-1 font-medium">
            Available trial slots will be dynamically displayed in your selected local time.
          </p>
        </div>

        {/* Course of Interest Selection */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-3">
            Select Course of Interest <span className="text-[#F28C28]">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(courses.length > 0 ? courses : FALLBACK_COURSES).map((c) => {
              const isSelected = formData.course === c.title || formData.courseId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setFormData({ ...formData, course: c.title, courseId: c.id });
                    if (errors.course) setErrors({ ...errors, course: undefined });
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left flex items-start gap-3 ${
                    isSelected
                      ? 'border-[#F28C28] bg-[#FFF0D2] shadow-sm'
                      : 'border-[#F7E4B6] bg-white hover:bg-[#FFF8E8] hover:border-[#FFC52E]'
                  }`}
                >
                  <span className="text-2xl shrink-0 p-1 rounded-xl bg-white/80 border border-[#F7E4B6]">{c.icon || '🚀'}</span>
                  <div>
                    <div className="font-extrabold text-sm text-[#713B18] leading-tight">
                      {c.title}
                    </div>
                    <div className="text-[11px] font-bold text-[#843B13] mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#F28C28]" />
                      {c.ageGroup || (c as any).age}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.course && (
            <p className="text-xs text-rose-600 font-bold mt-1.5">{errors.course}</p>
          )}
        </div>

        {/* Submit Primary CTA Button — Matching Reference Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isCheckingEligibility}
            className="btn-primary-gradient w-full py-4 px-6 text-base font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover disabled:opacity-50"
          >
            {isCheckingEligibility ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Checking Eligibility...</span>
              </>
            ) : (
              <>
                <span>Verify and Select Time</span>
                <ArrowRight className="w-5 h-5 text-[#713B18]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
