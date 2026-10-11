interface CountryFlagProps {
  code: string;
  name?: string;
  className?: string;
}

export function CountryFlag({ code, name, className = 'w-5 h-3.5' }: CountryFlagProps) {
  const upperCode = (code || '').toUpperCase();

  const renderSvgFlag = () => {
    switch (upperCode) {
      case 'IN': // India
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#f4c430" d="M0 0h640v160H0z" />
            <path fill="#ff9933" d="M0 0h640v160H0z" />
            <path fill="#fff" d="M0 160h640v160H0z" />
            <path fill="#128807" d="M0 320h640v160H0z" />
            <g transform="translate(320, 240)">
              <circle r="60" fill="none" stroke="#000080" strokeWidth="8" />
              <circle r="16" fill="#000080" />
              {Array.from({ length: 24 }).map((_, i) => (
                <line
                  key={i}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-60"
                  stroke="#000080"
                  strokeWidth="3.5"
                  transform={`rotate(${i * 15})`}
                />
              ))}
            </g>
          </svg>
        );

      case 'US': // United States
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            {Array.from({ length: 13 }).map((_, i) => (
              <rect
                key={i}
                x="0"
                y={(i * 480) / 13}
                width="640"
                height={480 / 13}
                fill={i % 2 === 0 ? '#b22234' : '#ffffff'}
              />
            ))}
            <rect x="0" y="0" width="256" height={(480 * 7) / 13} fill="#3c3b6e" />
            {/* Star grid placeholder representation */}
            <g fill="#fff">
              <circle cx="40" cy="40" r="10" />
              <circle cx="100" cy="40" r="10" />
              <circle cx="160" cy="40" r="10" />
              <circle cx="220" cy="40" r="10" />
              <circle cx="70" cy="80" r="10" />
              <circle cx="130" cy="80" r="10" />
              <circle cx="190" cy="80" r="10" />
              <circle cx="40" cy="120" r="10" />
              <circle cx="100" cy="120" r="10" />
              <circle cx="160" cy="120" r="10" />
              <circle cx="220" cy="120" r="10" />
              <circle cx="70" cy="160" r="10" />
              <circle cx="130" cy="160" r="10" />
              <circle cx="190" cy="160" r="10" />
              <circle cx="40" cy="200" r="10" />
              <circle cx="100" cy="200" r="10" />
              <circle cx="160" cy="200" r="10" />
              <circle cx="220" cy="200" r="10" />
            </g>
          </svg>
        );

      case 'GB': // United Kingdom
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <clipPath id="gb-t">
              <path d="M0 0v480h640V0z" />
            </clipPath>
            <path fill="#012169" d="M0 0h640v480H0z" />
            <path stroke="#fff" strokeWidth="60" d="M0 0l640 480M640 0L0 480" />
            <path stroke="#c8102e" strokeWidth="40" d="M0 0l640 480M640 0L0 480" />
            <path stroke="#fff" strokeWidth="100" d="M320 0v480M0 240h640" />
            <path stroke="#c8102e" strokeWidth="60" d="M320 0v480M0 240h640" />
          </svg>
        );

      case 'AE': // UAE
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#00732f" d="M0 0h640v160H0z" />
            <path fill="#fff" d="M0 160h640v160H0z" />
            <path fill="#000" d="M0 320h640v160H0z" />
            <path fill="#f00" d="M0 0h160v480H0z" />
          </svg>
        );

      case 'SG': // Singapore
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ed2939" d="M0 0h640v240H0z" />
            <path fill="#fff" d="M0 240h640v240H0z" />
            <circle cx="120" cy="120" r="70" fill="#fff" />
            <circle cx="145" cy="120" r="65" fill="#ed2939" />
            <g fill="#fff" transform="translate(170, 120)">
              <circle cx="0" cy="-35" r="10" />
              <circle cx="-33" cy="-11" r="10" />
              <circle cx="-21" cy="28" r="10" />
              <circle cx="21" cy="28" r="10" />
              <circle cx="33" cy="-11" r="10" />
            </g>
          </svg>
        );

      case 'CA': // Canada
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ff0000" d="M0 0h160v480H0zm480 0h160v480H480z" />
            <path fill="#fff" d="M160 0h320v480H160z" />
            <path
              fill="#ff0000"
              d="M320 80l24 64 64-16-32 56 64 24-72 32 16 80-64-32-64 32 16-80-72-32 64-24-32-56 64 16z"
            />
            <rect x="312" y="300" width="16" height="60" fill="#ff0000" />
          </svg>
        );

      case 'AU': // Australia
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#00008b" d="M0 0h640v480H0z" />
            {/* Mini Union Jack */}
            <g transform="scale(0.5)">
              <path fill="#012169" d="M0 0h640v480H0z" />
              <path stroke="#fff" strokeWidth="60" d="M0 0l640 480M640 0L0 480" />
              <path stroke="#c8102e" strokeWidth="40" d="M0 0l640 480M640 0L0 480" />
              <path stroke="#fff" strokeWidth="100" d="M320 0v480M0 240h640" />
              <path stroke="#c8102e" strokeWidth="60" d="M320 0v480M0 240h640" />
            </g>
            {/* Commonwealth Star */}
            <circle cx="160" cy="360" r="36" fill="#fff" />
            {/* Southern Cross */}
            <circle cx="480" cy="100" r="14" fill="#fff" />
            <circle cx="560" cy="180" r="14" fill="#fff" />
            <circle cx="480" cy="380" r="14" fill="#fff" />
            <circle cx="400" cy="240" r="14" fill="#fff" />
            <circle cx="520" cy="280" r="9" fill="#fff" />
          </svg>
        );

      case 'DE': // Germany
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#000" d="M0 0h640v160H0z" />
            <path fill="#d00" d="M0 160h640v160H0z" />
            <path fill="#ffce00" d="M0 320h640v160H0z" />
          </svg>
        );

      case 'FR': // France
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#002654" d="M0 0h213v480H0z" />
            <path fill="#fff" d="M213 0h214v480H213z" />
            <path fill="#ce1126" d="M427 0h213v480H427z" />
          </svg>
        );

      case 'SA': // Saudi Arabia
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#006c35" d="M0 0h640v480H0z" />
            <path stroke="#fff" strokeWidth="12" d="M200 320h240M220 300l-40 20 40 20" />
            <rect x="220" y="180" width="200" height="70" rx="10" fill="#fff" />
            <text x="320" y="230" fill="#006c35" fontSize="36" fontWeight="bold" textAnchor="middle">SA</text>
          </svg>
        );

      case 'QA': // Qatar
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#8a1538" d="M0 0h640v480H0z" />
            <path fill="#fff" d="M0 0h160l60 27-60 26 60 27-60 27 60 27-60 26 60 27-60 27 60 27-60 26 60 27-60 27 60 27-60 26 60 27-60 27 60 27-60 26 60 27-60 27H0z" />
          </svg>
        );

      case 'KW': // Kuwait
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#007a3d" d="M0 0h640v160H0z" />
            <path fill="#fff" d="M0 160h640v160H0z" />
            <path fill="#ce1126" d="M0 320h640v160H0z" />
            <path fill="#000" d="M0 0l160 160v160L0 480z" />
          </svg>
        );

      case 'OM': // Oman
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#fff" d="M0 0h640v160H0z" />
            <path fill="#db161b" d="M0 160h640v160H0z" />
            <path fill="#008000" d="M0 320h640v160H0z" />
            <path fill="#db161b" d="M0 0h160v480H0z" />
          </svg>
        );

      case 'BH': // Bahrain
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ce1126" d="M0 0h640v480H0z" />
            <path fill="#fff" d="M0 0h160l64 48-64 48 64 48-64 48 64 48-64 48 64 48-64 48 64 48-64 48H0z" />
          </svg>
        );

      case 'NZ': // New Zealand
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#00247d" d="M0 0h640v480H0z" />
            <g transform="scale(0.5)">
              <path fill="#012169" d="M0 0h640v480H0z" />
              <path stroke="#fff" strokeWidth="60" d="M0 0l640 480M640 0L0 480" />
              <path stroke="#c8102e" strokeWidth="40" d="M0 0l640 480M640 0L0 480" />
              <path stroke="#fff" strokeWidth="100" d="M320 0v480M0 240h640" />
              <path stroke="#c8102e" strokeWidth="60" d="M320 0v480M0 240h640" />
            </g>
            <circle cx="500" cy="120" r="16" fill="#cc142b" stroke="#fff" strokeWidth="4" />
            <circle cx="560" cy="220" r="16" fill="#cc142b" stroke="#fff" strokeWidth="4" />
            <circle cx="500" cy="360" r="18" fill="#cc142b" stroke="#fff" strokeWidth="4" />
            <circle cx="440" cy="260" r="14" fill="#cc142b" stroke="#fff" strokeWidth="4" />
          </svg>
        );

      case 'JP': // Japan
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#fff" d="M0 0h640v480H0z" />
            <circle cx="320" cy="240" r="144" fill="#bc002d" />
          </svg>
        );

      case 'KR': // South Korea
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#fff" d="M0 0h640v480H0z" />
            <circle cx="320" cy="240" r="100" fill="#cd2e3a" />
            <path d="M220 240a100 100 0 0 0 200 0c0-55.2-44.8-100-100-100s-100 44.8-100 100z" fill="#0047a0" />
            <circle cx="270" cy="240" r="50" fill="#cd2e3a" />
            <circle cx="370" cy="240" r="50" fill="#0047a0" />
          </svg>
        );

      case 'HK': // Hong Kong
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#de2910" d="M0 0h640v480H0z" />
            <circle cx="320" cy="240" r="90" fill="#fff" />
            <circle cx="320" cy="240" r="60" fill="#de2910" />
          </svg>
        );

      case 'MY': // Malaysia
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            {Array.from({ length: 14 }).map((_, i) => (
              <rect
                key={i}
                x="0"
                y={(i * 480) / 14}
                width="640"
                height={480 / 14}
                fill={i % 2 === 0 ? '#cc0000' : '#ffffff'}
              />
            ))}
            <rect x="0" y="0" width="320" height={(480 * 8) / 14} fill="#000066" />
            <circle cx="140" cy="140" r="70" fill="#ffcc00" />
            <circle cx="165" cy="140" r="65" fill="#000066" />
            <polygon
              points="190,140 160,150 170,120 145,135 155,105 130,125 130,95 115,120 105,95 105,125 80,105 95,130 70,120 90,140"
              fill="#ffcc00"
            />
          </svg>
        );

      case 'ID': // Indonesia
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ce1126" d="M0 0h640v240H0z" />
            <path fill="#fff" d="M0 240h640v240H0z" />
          </svg>
        );

      case 'PH': // Philippines
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#0038a8" d="M0 0h640v240H0z" />
            <path fill="#ce1126" d="M0 240h640v240H0z" />
            <path fill="#fff" d="M0 0l320 240L0 480z" />
            <circle cx="100" cy="240" r="30" fill="#fcd116" />
          </svg>
        );

      case 'TH': // Thailand
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#a51931" d="M0 0h640v80H0zm0 400h640v80H0z" />
            <path fill="#f4f5f8" d="M0 80h640v80H0zm0 240h640v80H0z" />
            <path fill="#2d2a4a" d="M0 160h640v160H0z" />
          </svg>
        );

      case 'VN': // Vietnam
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#da251d" d="M0 0h640v480H0z" />
            <polygon
              points="320,130 350,220 440,220 370,275 400,360 320,310 240,360 270,275 200,220 290,220"
              fill="#ffff00"
            />
          </svg>
        );

      case 'IE': // Ireland
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#169b62" d="M0 0h213v480H0z" />
            <path fill="#fff" d="M213 0h214v480H213z" />
            <path fill="#ff883e" d="M427 0h213v480H427z" />
          </svg>
        );

      case 'NL': // Netherlands
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ae1c28" d="M0 0h640v160H0z" />
            <path fill="#fff" d="M0 160h640v160H0z" />
            <path fill="#21468b" d="M0 320h640v160H0z" />
          </svg>
        );

      case 'CH': // Switzerland
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#d52b1e" d="M0 0h640v480H0z" />
            <rect x="270" y="100" width="100" height="280" fill="#fff" />
            <rect x="180" y="190" width="280" height="100" fill="#fff" />
          </svg>
        );

      case 'SE': // Sweden
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#006aa7" d="M0 0h640v480H0z" />
            <path stroke="#fecc00" strokeWidth="80" d="M200 0v480M0 240h640" />
          </svg>
        );

      case 'NO': // Norway
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ba0c2f" d="M0 0h640v480H0z" />
            <path stroke="#fff" strokeWidth="100" d="M200 0v480M0 240h640" />
            <path stroke="#00205b" strokeWidth="60" d="M200 0v480M0 240h640" />
          </svg>
        );

      case 'DK': // Denmark
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#c60c30" d="M0 0h640v480H0z" />
            <path stroke="#fff" strokeWidth="60" d="M220 0v480M0 240h640" />
          </svg>
        );

      case 'FI': // Finland
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#fff" d="M0 0h640v480H0z" />
            <path stroke="#003580" strokeWidth="90" d="M220 0v480M0 240h640" />
          </svg>
        );

      case 'BE': // Belgium
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#000" d="M0 0h213v480H0z" />
            <path fill="#ffd90c" d="M213 0h214v480H213z" />
            <path fill="#f31830" d="M427 0h213v480H427z" />
          </svg>
        );

      case 'AT': // Austria
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ed2939" d="M0 0h640v160H0zm0 320h640v160H0z" />
            <path fill="#fff" d="M0 160h640v160H0z" />
          </svg>
        );

      case 'ES': // Spain
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#aa151b" d="M0 0h640v120H0zm0 360h640v120H0z" />
            <path fill="#f1bf00" d="M0 120h640v240H0z" />
            <circle cx="200" cy="240" r="40" fill="#aa151b" />
          </svg>
        );

      case 'IT': // Italy
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#009246" d="M0 0h213v480H0z" />
            <path fill="#fff" d="M213 0h214v480H213z" />
            <path fill="#ce2b37" d="M427 0h213v480H427z" />
          </svg>
        );

      case 'PT': // Portugal
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#046a38" d="M0 0h256v480H0z" />
            <path fill="#da291c" d="M256 0h384v480H256z" />
            <circle cx="256" cy="240" r="60" fill="#ffcd00" stroke="#000" strokeWidth="4" />
          </svg>
        );

      case 'PL': // Poland
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#fff" d="M0 0h640v240H0z" />
            <path fill="#dc143c" d="M0 240h640v240H0z" />
          </svg>
        );

      case 'ZA': // South Africa
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#000" d="M0 0h640v480H0z" />
            <path fill="#e03c31" d="M0 0h640v160H0z" />
            <path fill="#001489" d="M0 320h640v160H0z" />
            <polygon points="0,0 240,240 0,480" fill="#000" />
            <polygon points="0,40 200,240 0,440" fill="#ffb81c" />
            <path stroke="#007749" strokeWidth="80" d="M0 0l240 240h400M0 480l240-240" />
          </svg>
        );

      case 'NG': // Nigeria
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#008751" d="M0 0h213v480H0zm427 0h213v480H427z" />
            <path fill="#fff" d="M213 0h214v480H213z" />
          </svg>
        );

      case 'KE': // Kenya
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#000" d="M0 0h640v140H0z" />
            <path fill="#fff" d="M0 140h640v200H0z" />
            <path fill="#bb162b" d="M0 160h640v160H0z" />
            <path fill="#006600" d="M0 340h640v140H0z" />
            <ellipse cx="320" cy="240" rx="50" ry="80" fill="#bb162b" stroke="#fff" strokeWidth="8" />
          </svg>
        );

      case 'EG': // Egypt
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ce1126" d="M0 0h640v160H0z" />
            <path fill="#fff" d="M0 160h640v160H0z" />
            <path fill="#000" d="M0 320h640v160H0z" />
            <circle cx="320" cy="240" r="24" fill="#c09300" />
          </svg>
        );

      case 'BR': // Brazil
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#009c3b" d="M0 0h640v480H0z" />
            <polygon points="320,40 580,240 320,440 60,240" fill="#ffdf00" />
            <circle cx="320" cy="240" r="90" fill="#002776" />
            <path stroke="#fff" strokeWidth="12" fill="none" d="M235 250a90 90 0 0 1 170-20" />
          </svg>
        );

      case 'MX': // Mexico
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#006847" d="M0 0h213v480H0z" />
            <path fill="#fff" d="M213 0h214v480H213z" />
            <path fill="#ce1126" d="M427 0h213v480H427z" />
            <circle cx="320" cy="240" r="30" fill="#7a5229" />
          </svg>
        );

      case 'AR': // Argentina
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#74acdf" d="M0 0h640v160H0zm0 320h640v160H0z" />
            <path fill="#fff" d="M0 160h640v160H0z" />
            <circle cx="320" cy="240" r="36" fill="#f6b40e" stroke="#85340a" strokeWidth="2" />
          </svg>
        );

      case 'CL': // Chile
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#fff" d="M0 0h640v240H0z" />
            <path fill="#d52b1e" d="M0 240h640v240H0z" />
            <rect x="0" y="0" width="240" height="240" fill="#0039a6" />
            <circle cx="120" cy="120" r="36" fill="#fff" />
          </svg>
        );

      case 'CO': // Colombia
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#fcd116" d="M0 0h640v240H0z" />
            <path fill="#003893" d="M0 240h640v120H0z" />
            <path fill="#ce1126" d="M0 360h640v120H0z" />
          </svg>
        );

      case 'IL': // Israel
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#fff" d="M0 0h640v480H0z" />
            <rect x="0" y="50" width="640" height="60" fill="#0038b8" />
            <rect x="0" y="370" width="640" height="60" fill="#0038b8" />
            <polygon points="320,170 380,270 260,270" stroke="#0038b8" strokeWidth="14" fill="none" />
            <polygon points="320,310 380,210 260,210" stroke="#0038b8" strokeWidth="14" fill="none" />
          </svg>
        );

      case 'TR': // Turkey
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#e30a17" d="M0 0h640v480H0z" />
            <circle cx="280" cy="240" r="100" fill="#fff" />
            <circle cx="310" cy="240" r="80" fill="#e30a17" />
            <polygon points="380,240 410,250 395,225 410,200 385,215 365,195 375,225 350,235 375,250 365,275" fill="#fff" />
          </svg>
        );

      case 'LK': // Sri Lanka
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ffbe29" d="M0 0h640v480H0z" />
            <rect x="30" y="30" width="80" height="420" fill="#00534e" />
            <rect x="130" y="30" width="80" height="420" fill="#eb7400" />
            <rect x="230" y="30" width="380" height="420" fill="#8d153a" />
            <circle cx="420" cy="240" r="60" fill="#ffbe29" />
          </svg>
        );

      case 'BD': // Bangladesh
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#006a4e" d="M0 0h640v480H0z" />
            <circle cx="280" cy="240" r="130" fill="#f42a41" />
          </svg>
        );

      case 'NP': // Nepal
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#003893" d="M0 0h640v480H0z" />
            <polygon points="40,20 400,220 160,220 400,440 40,440" fill="#dc143c" stroke="#003893" strokeWidth="20" />
            <circle cx="160" cy="140" r="28" fill="#fff" />
            <circle cx="160" cy="340" r="32" fill="#fff" />
          </svg>
        );

      default:
        return (
          <div className="w-full h-full bg-[#FFF0D2] flex items-center justify-center text-[9px] font-black font-mono text-[#843B13]">
            {upperCode.slice(0, 2)}
          </div>
        );
    }
  };

  return (
    <span
      className={`inline-block overflow-hidden rounded-[3px] shadow-xs border border-black/15 shrink-0 select-none align-middle ${className}`}
      title={name || upperCode}
      aria-label={name || `Flag of ${upperCode}`}
      role="img"
    >
      {renderSvgFlag()}
    </span>
  );
}
