import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';

// Illustrative sample figures only (not real user data). Numbers are
// consistent: category totals add up to the expense total shown.
// Amounts are deliberately shown without a currency symbol.
const SAMPLE = {
  income: 97500.5,
  categories: [
    { name: 'Rent', amount: 22000 },
    { name: 'Food', amount: 2450.75 },
    { name: 'Transport', amount: 850 },
    { name: 'Utilities', amount: 800 },
  ],
  goal: { title: 'Emergency fund', saved: 12500.25, target: 25000 },
  recent: [
    ['01 Oct', 'Groceries', 'Food', -450.75],
    ['15 Oct', 'Design project', 'Freelance', 12500.5],
    ['31 Oct', 'Electricity bill', 'Utilities', -1800],
  ],
};
SAMPLE.expenses = SAMPLE.categories.reduce((sum, c) => sum + c.amount, 0);
SAMPLE.net = SAMPLE.income - SAMPLE.expenses;

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const Num = ({ children, className = '' }) => (
  <span className={`font-mono tabular-nums ${className}`}>{children}</span>
);

const Tag = ({ children }) => (
  <span className="rounded-full border border-line px-2 py-0.5 text-sm font-medium text-ink-mute">
    {children}
  </span>
);

/* ---------- Hero ---------- */

const Wordmark = () => (
  <div
    aria-hidden="true"
    className="select-none whitespace-nowrap font-display font-extrabold leading-[.8] tracking-[-0.015em] text-paper"
    style={{
      fontSize: 'clamp(4.25rem, 24.5vw, 24rem)',
      fontVariationSettings: "'wdth' 88, 'opsz' 96",
      fontVariantLigatures: 'none',
    }}
  >
    cashfl
    <span className="mx-[.02em] inline-block h-[.5em] w-[.5em] rounded-full bg-accent align-baseline" />
    w
  </div>
);

const Hero = () => (
  <section className="relative overflow-hidden bg-forest-deep text-paper">
    {/* geometric coins: decorative */}
    <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-brand/40 sm:h-[26rem] sm:w-[26rem]" />

    <div className="wrap relative">
      <nav className="flex h-20 items-center justify-between" aria-label="Main">
        <Link to="/" aria-label="Cashflow home">
          <Logo light />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            Sign in
          </Link>
          <Link to="/register" className="btn-accent">
            Get started
          </Link>
        </div>
      </nav>

      <div className="animate-rise pt-10 sm:pt-16">
        <Wordmark />
      </div>

      <div className="relative grid gap-10 pb-44 pt-12 sm:pb-52 sm:pt-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <h1 className="animate-rise text-balance font-display text-5xl font-extrabold leading-[.98] tracking-[-0.03em] sm:text-6xl lg:text-7xl [animation-delay:80ms]">
          Know where your money{' '}
          <span className="relative mx-1.5 inline-block">
            <span className="relative z-10 text-forest-deep">goes.</span>
            <span aria-hidden="true" className="absolute -inset-x-2 inset-y-1 -rotate-1 rounded-xl bg-accent" />
          </span>
        </h1>
        <div className="animate-rise [animation-delay:160ms]">
          <p className="max-w-md text-lg leading-relaxed text-paper/75">
            Track income, expenses, recurring bills and savings goals, then see how the month is
            really going.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register" className="btn-accent px-6 py-3 text-base">
              Create an account
            </Link>
            <Link to="/login" className="btn border border-white/25 px-6 py-3 text-base text-paper hover:bg-white/10">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ---------- Product preview (overlaps hero) ---------- */

const Preview = () => {
  const max = Math.max(...SAMPLE.categories.map((c) => c.amount));
  const pct = Math.round((SAMPLE.goal.saved / SAMPLE.goal.target) * 100);
  return (
    <section className="wrap relative -mt-32 sm:-mt-40" aria-label="Example of the Cashflow dashboard">
      <div className="card grid gap-px overflow-hidden bg-line shadow-lift lg:grid-cols-[1.25fr_1fr_1.1fr]">
        {/* Net + categories */}
        <div className="bg-card p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="font-display text-xl font-bold">October</p>
            <Tag>Sample data</Tag>
          </div>
          <p className="mt-6 text-sm text-ink-mute">Net this month</p>
          <p className="mt-1 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            <Num>{fmt(SAMPLE.net)}</Num>
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink-mute">Income</dt>
              <dd className="mt-0.5 font-semibold text-brand"><Num>+{fmt(SAMPLE.income)}</Num></dd>
            </div>
            <div>
              <dt className="text-ink-mute">Expenses</dt>
              <dd className="mt-0.5 font-semibold text-signal"><Num>−{fmt(SAMPLE.expenses)}</Num></dd>
            </div>
          </dl>
          <ul className="mt-6 space-y-3">
            {SAMPLE.categories.map((c) => (
              <li key={c.name} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm">
                <span className="text-ink-soft">{c.name}</span>
                <span className="h-2 rounded-full bg-paper">
                  <span className="block h-2 rounded-full bg-forest" style={{ width: `${Math.max(4, (c.amount / max) * 100)}%` }} />
                </span>
                <Num className="text-ink-soft">{fmt(c.amount)}</Num>
              </li>
            ))}
          </ul>
        </div>

        {/* Goal + due bill */}
        <div className="flex flex-col justify-between gap-8 bg-card p-6 sm:p-8">
          <div>
            <p className="font-display text-xl font-bold">Goal</p>
            <p className="mt-6 text-base text-ink-soft">{SAMPLE.goal.title}</p>
            <p className="mt-1 font-display text-6xl font-extrabold tracking-tight">{pct}<span className="text-3xl text-ink-mute">%</span></p>
            <div
              className="mt-4 h-3 rounded-full bg-paper"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${SAMPLE.goal.title} progress`}
            >
              <div className="h-3 rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm text-ink-mute">
              <Num>{fmt(SAMPLE.goal.saved)}</Num> of <Num>{fmt(SAMPLE.goal.target)}</Num>
            </p>
          </div>
          <div className="rounded-xl bg-accent-tint p-4">
            <p className="text-sm font-semibold text-forest">Due in 3 days</p>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="font-medium">Electricity bill</p>
              <Num className="font-semibold">1,800.00</Num>
            </div>
          </div>
        </div>

        {/* Recent */}
        <div className="bg-card p-6 sm:p-8">
          <p className="font-display text-xl font-bold">Recent</p>
          <ul className="mt-6 divide-y divide-line text-sm">
            {SAMPLE.recent.map(([d, name, cat, amt]) => (
              <li key={name} className="py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{name}</span>
                  <Num className={`font-semibold ${amt < 0 ? 'text-signal' : 'text-brand'}`}>
                    {amt < 0 ? '−' : '+'}{fmt(Math.abs(amt))}
                  </Num>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-ink-mute">
                  <Num>{d}</Num>
                  <span className="chip bg-paper text-ink-soft">{cat}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

/* ---------- Features: editorial list ---------- */

const FEATURES = [
  ['Transactions', 'Every entry, categorised and dated.', 'Log income and expenses in seconds, search them later, and edit or delete without your totals drifting.'],
  ['Goals', 'Savings that track themselves.', 'Link deposits to a goal and its progress updates on its own, all the way to completed.'],
  ['Recurring', 'Bills that remind you.', 'Mark a transaction as recurring (daily, weekly, monthly or yearly) and get an email before it is due.'],
  ['Health', 'A monthly read on your finances.', 'Income against expenses, summed up as a status from critical to excellent.'],
  ['Assistant', 'Ask the budgeting assistant.', 'Chat about your budget in plain language. Suggestions are guidance, not financial advice.'],
];

const Features = () => (
  <section id="features" className="wrap py-24 sm:py-32">
    <div className="grid gap-12 lg:grid-cols-[1fr_1.7fr]">
      <div className="lg:sticky lg:top-10 lg:self-start">
        <h2 className="text-balance font-display text-5xl font-extrabold leading-[.98] tracking-[-0.03em] sm:text-6xl">
          The whole month, in one place.
        </h2>
        <p className="mt-5 max-w-sm text-lg leading-relaxed text-ink-mute">
          The ledger and the bigger picture together, so the numbers on a chart are the ones you
          actually entered.
        </p>
      </div>
      <ol className="border-b border-ink">
        {FEATURES.map(([, title, text], i) => (
          <li key={title} className="group grid grid-cols-[3.5rem_1fr] gap-x-4 border-t border-ink py-7 sm:grid-cols-[5rem_1fr] sm:py-9">
            <span className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h3>
              <p className="mt-2 max-w-xl leading-relaxed text-ink-mute">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

/* ---------- Closing CTA + footer ---------- */

const Closing = () => (
  <section className="wrap py-20 sm:py-28">
    <div className="relative overflow-hidden rounded-[2rem] bg-accent p-8 sm:p-14">
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-forest-deep/10" />
      <h2 className="relative max-w-3xl text-balance font-display text-5xl font-extrabold leading-[.98] tracking-[-0.03em] text-forest-deep sm:text-7xl">
        Start with this month.
      </h2>
      <div className="relative mt-8 flex flex-wrap gap-3">
        <Link to="/register" className="btn-primary px-7 py-3.5 text-base">
          Create an account
        </Link>
        <Link to="/login" className="btn border border-forest-deep/30 px-7 py-3.5 text-base text-forest-deep hover:bg-forest-deep/10">
          Sign in
        </Link>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-forest-deep text-paper">
    <div className="wrap flex flex-col gap-3 py-10 text-sm text-paper/60 sm:flex-row sm:items-center sm:justify-between">
      <Logo light />
      <p>A personal project. Figures on this page are illustrative samples.</p>
    </div>
  </footer>
);

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to appropriate dashboard
    if (user) {
      if (user.is_admin) {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <main>
        <Hero />
        <Preview />
        <Features />
        <Closing />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
