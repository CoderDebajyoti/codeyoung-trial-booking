export function CodeyoungLogo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} aria-label="Codeyoung">
      {/* Official Codeyoung Spark / Rocket Emblem */}
      <svg
        className="h-9 w-9 shrink-0"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD45A" />
            <stop offset="50%" stopColor="#FFC52E" />
            <stop offset="100%" stopColor="#F28C28" />
          </linearGradient>
          <linearGradient id="cySparkle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFF0D2" />
          </linearGradient>
        </defs>
        {/* Rounded Diamond / Learning Shield */}
        <rect
          x="3"
          y="3"
          width="38"
          height="38"
          rx="12"
          fill="url(#cyGrad)"
          className="filter drop-shadow-sm"
        />
        {/* Dynamic Star / Compass Learning Core */}
        <path
          d="M22 10L24.8 18.2C25.3 19.7 26.3 20.7 27.8 21.2L36 24L27.8 26.8C26.3 27.3 25.3 28.3 24.8 29.8L22 38L19.2 29.8C18.7 28.3 17.7 27.3 16.2 26.8L8 24L16.2 21.2C17.7 20.7 18.7 19.7 19.2 18.2L22 10Z"
          fill="url(#cySparkle)"
        />
        {/* Center Accent Dot */}
        <circle cx="22" cy="24" r="3.2" fill="#713B18" />
        <circle cx="22" cy="24" r="1.5" fill="#FFFFFF" />
      </svg>

      {/* Brand Wordmark */}
      <div className="flex flex-col justify-center leading-none">
        <span className="font-heading font-extrabold text-[22px] tracking-tight text-[#713B18]">
          code<span className="text-[#F28C28]">young</span>
        </span>
      </div>
    </div>
  );
}
