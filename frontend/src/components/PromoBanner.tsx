import { Sparkles, ArrowRight, ShieldCheck, Star, Users } from 'lucide-react';

interface PromoBannerProps {
  onAction?: () => void;
  onCtaClick?: () => void;
  actionLabel?: string;
  ctaText?: string;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  compact?: boolean;
}

export function PromoBanner({
  onAction,
  onCtaClick,
  actionLabel,
  ctaText = 'Book Free Trial Class',
  badgeText = '1:1 Live Interactive STEM Classes',
  title = 'Empower Your Child with Future-Ready Coding & AI Skills',
  subtitle,
  description = 'Certified global mentors, tailored curriculum, and hands-on project building for ages 6 to 18.',
  compact = false,
}: PromoBannerProps) {
  const handleAction = onAction || onCtaClick;
  const label = actionLabel || ctaText;
  const desc = subtitle || description;

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-[#FFF0D2] via-[#FFE6B3] to-[#FFD45A]/40 rounded-2xl p-4 sm:p-5 border border-[#F7E4B6] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#F28C28] shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#713B18]">{title}</h4>
            <p className="text-xs text-[#843B13]">{desc}</p>
          </div>
        </div>

        {handleAction && (
          <button
            onClick={handleAction}
            className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-extrabold text-[#713B18] shrink-0 shadow-btn hover:shadow-btn-hover cursor-pointer"
          >
            {label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#FFD45A] via-[#FFC52E] to-[#FFB82E] p-6 sm:p-8 rounded-3xl border border-[#F7E4B6] shadow-card-warm text-[#713B18] relative overflow-hidden">
      {/* Decorative backdrop elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/40 text-[#713B18] text-xs font-extrabold border border-white/50 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#843B13]" />
            <span>{badgeText}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#713B18] tracking-tight leading-snug">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-[#843B13] font-semibold leading-relaxed">
            {desc}
          </p>

          <div className="flex items-center gap-4 pt-1 text-[11px] font-bold text-[#713B18]/90">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#843B13]" /> 100% Free 30-Min Trial
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#843B13]" /> 1:1 Dedicated Mentor
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[#843B13] fill-[#843B13]" /> 4.9/5 Rating
            </span>
          </div>
        </div>

        {handleAction && (
          <button
            onClick={handleAction}
            className="btn-primary-gradient px-6 py-4 rounded-2xl text-sm font-extrabold text-[#713B18] flex items-center gap-2 cursor-pointer shadow-btn hover:shadow-btn-hover shrink-0"
          >
            <span>{label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
