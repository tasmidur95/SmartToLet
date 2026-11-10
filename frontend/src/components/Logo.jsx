export const BRAND = 'Smart Tolet';

export function LogoMark({ size = 34 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={BRAND}>
      <defs>
        <linearGradient id="st-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f766e" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#st-g)" />
      <path d="M12 32 32 14l20 18M18 30v20h28V30" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <g className="logo-sign">
        <path d="M32 32v5" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="23" y="37" width="18" height="9" rx="2.5" fill="#fde047" />
        <text x="32" y="44" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#064e3b" fontFamily="Inter, Arial, sans-serif">TO-LET</text>
      </g>
    </svg>
  );
}

export default function Logo({ light = false }) {
  return (
    <span className={`brand-logo ${light ? 'light' : ''}`}>
      <LogoMark />
      <span className="brand-text">Smart To-<b>LET</b></span>
    </span>
  );
}
