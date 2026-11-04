import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

// Shared split layout for Login / Register / Forgot / Reset.
// Left: brand panel (decorative). Right: the form (children).
const AuthShell = ({ panelTitle, panelNote, children, footer }) => (
  <div className="grid min-h-screen bg-paper lg:grid-cols-[1.05fr_1fr]">
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest-deep p-10 text-paper lg:flex xl:p-14">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-32 h-[34rem] w-[34rem] rounded-full bg-brand/40" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-24 right-20 h-28 w-28 rounded-full bg-accent" />

      <Link to="/" aria-label="Cashflow home" className="relative w-fit">
        <Logo light />
      </Link>

      <div className="relative">
        <h2 className="max-w-xl text-balance font-display text-6xl font-extrabold leading-[.95] tracking-[-0.03em] xl:text-7xl">
          {panelTitle}
        </h2>
        {panelNote && <p className="mt-6 max-w-sm text-lg leading-relaxed text-paper/70">{panelNote}</p>}
      </div>

      <p className="relative text-sm text-paper/55">Cashflow is a personal project.</p>
    </aside>

    <main className="flex items-center justify-center px-4 py-12 sm:px-8">
      <div className="w-full max-w-md">
        <Link to="/" aria-label="Cashflow home" className="mb-10 inline-block lg:hidden">
          <Logo />
        </Link>
        {children}
        {footer && <div className="mt-8 text-sm text-ink-mute">{footer}</div>}
      </div>
    </main>
  </div>
);

export const FormHeading = ({ title, subtitle }) => (
  <>
    <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] text-ink sm:text-5xl">{title}</h1>
    {subtitle && <p className="mt-3 text-base text-ink-mute">{subtitle}</p>}
  </>
);

export const Notice = ({ tone = 'error', id, className = 'mt-6', children }) => {
  const tones = {
    error: 'border-signal/25 bg-signal/5 text-signal',
    success: 'border-brand/25 bg-brand-tint text-brand-dark',
  };
  return (
    <div
      id={id}
      role={tone === 'error' ? 'alert' : 'status'}
      className={`${className} rounded-xl border p-3.5 text-sm font-medium ${tones[tone]}`}
    >
      {children}
    </div>
  );
};

export default AuthShell;
