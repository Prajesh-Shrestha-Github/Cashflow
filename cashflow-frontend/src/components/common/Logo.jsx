// Mark: an open "C" ring (a coin mid-flow) with an accent dot. `light` is for dark backgrounds.
const Logo = ({ light = false, compact = false, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill={light ? '#F5EFE0' : '#0B3326'} />
      <path
        d="M21.5 11.2A7.2 7.2 0 1 0 21.5 20.8"
        fill="none"
        stroke={light ? '#0B3326' : '#F5EFE0'}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="23.4" cy="16" r="2.5" fill="#FF5C8D" />
    </svg>
    {!compact && <span
      className={`font-display text-xl font-extrabold tracking-tight ${light ? 'text-paper' : 'text-ink'}`}
    >
      cashflow
    </span>}
  </span>
);

export default Logo;
