import React, { useState } from 'react';
import { Lock, Mail, KeyRound, Loader2, AlertCircle, ShieldCheck, X } from 'lucide-react';
import { api, AuthUser } from '../lib/api';

interface MentorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export function MentorLoginModal({ isOpen, onClose, onLoginSuccess }: MentorLoginModalProps) {
  const [email, setEmail] = useState<string>('aarav.sharma@codeyoung.com');
  const [password, setPassword] = useState<string>('Mentor@Codeyoung2026!');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { user } = await api.login(email, password, 'test-captcha-token');
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
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
            <Lock className="w-3.5 h-3.5 text-[#843B13]" /> Company Portal Login
          </div>
          <h3 className="text-xl font-heading font-extrabold text-[#713B18]">
            Mentor & Admin Access
          </h3>
          <p className="text-[#843B13] text-xs mt-1 font-semibold">
            Sign in to manage 1:1 trial class schedules and daily capacity.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-1.5">
              Company Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mentor@codeyoung.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-xs font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#713B18] mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F28C28]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#F7E4B6] bg-[#FFF8E8]/30 text-xs font-bold text-[#713B18] focus:border-[#F28C28] focus:ring-4 focus:ring-[#FFD45A]/40 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Quick Demo Credentials Helper */}
          <div className="pt-1 pb-1">
            <span className="text-[11px] font-bold text-[#843B13] block mb-1.5">
              ⚡ Quick Demo Credentials:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('aarav.sharma@codeyoung.com', 'Mentor@Codeyoung2026!')}
                className="px-2.5 py-1 rounded-xl bg-[#FFF0D2] border border-[#F7E4B6] text-[11px] font-extrabold text-[#713B18] hover:bg-[#FFE5B4] cursor-pointer"
              >
                Aarav (Mentor)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sarah.johnson@codeyoung.com', 'Mentor@Codeyoung2026!')}
                className="px-2.5 py-1 rounded-xl bg-[#FFF0D2] border border-[#F7E4B6] text-[11px] font-extrabold text-[#713B18] hover:bg-[#FFE5B4] cursor-pointer"
              >
                Sarah (Mentor)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@codeyoung.com', 'Admin@Codeyoung2026!')}
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
              disabled={isLoading}
              className="btn-primary-gradient w-full py-3.5 px-5 text-sm font-extrabold text-[#713B18] flex items-center justify-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#713B18]" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#713B18]" />
                  <span>Sign In to Portal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
