// The dashboard's focal point: what you have, in one glance, with the one action you take most.
// The balance is ALL income minus ALL spending until today (not a period), plus how it moved over 30 days.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getBalance } from '../../services/balanceService';
import { formatNPR, formatNPRSigned } from '../../utils/formatMoney';

const W = 600;
const H = 90;
const PAD = 6;

function Sparkline({ trend }) {
  const values = trend.map((p) => Number(p.balance)); // display only: the exact figures stay strings
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values.map((v, i) => [(i / (values.length - 1)) * W, H - PAD - ((v - min) / span) * (H - 2 * PAD)]);
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const label = `Balance over the last 30 days: from ${formatNPRSigned(trend[0].balance)} to ${formatNPRSigned(trend[trend.length - 1].balance)}`;
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="relative mt-6 h-24 w-full">
      <polygon points={`0,${H} ${line} ${W},${H}`} fill="rgba(255,180,0,0.14)" />
      <polyline points={line} fill="none" stroke="#FFB400" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const movement = (data) => {
  const size = formatNPR(String(data.change_30d).replace('-', ''));
  if (data.direction === 'up') return { arrow: '↑', text: `Up ${size} in the last 30 days` };
  if (data.direction === 'down') return { arrow: '↓', text: `Down ${size} in the last 30 days` };
  return { arrow: '', text: 'No change in the last 30 days' };
};

const BalanceHero = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getBalance());
    } catch (e) {
      setError(e.message || 'We could not load your balance. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p role="status" className="text-lg text-ink-mute">Checking your balance...</p>;

  if (error) {
    return (
      <div role="alert" className="card-pad">
        <p className="text-lg font-medium text-signal">{error}</p>
        <button type="button" onClick={load} className="btn-primary mt-4 px-5 py-3 text-base">Try again</button>
      </div>
    );
  }

  const shell = 'relative overflow-hidden rounded-3xl bg-forest-deep p-6 text-paper sm:p-10';
  const decor = (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brand/40" />
      <div aria-hidden="true" className="pointer-events-none absolute hidden sm:block -bottom-12 right-28 h-28 w-28 rounded-full bg-accent" />
    </>
  );

  if (!data.has_data) {
    return (
      <section aria-label="Your balance" className={shell}>
        {decor}
        <p className="relative text-lg text-paper/70">Your balance</p>
        <p className="relative mt-3 max-w-xl text-3xl font-semibold leading-snug">Add your first income or expense to see your balance.</p>
        <Link to="/transactions" state={{ openForm: true }} className="btn-accent relative mt-6 px-7 py-3.5 text-lg">Add my first transaction</Link>
      </section>
    );
  }

  const negative = String(data.balance).startsWith('-');
  const { arrow, text } = movement(data);
  const last = data.last_30_days;

  return (
    <section aria-label="Your balance" className={shell}>
      {decor}
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <p className="text-lg text-paper/70">Your balance</p>
        <Link to="/transactions" state={{ openForm: true }} className="btn-accent px-6 py-3 text-base">Add transaction</Link>
      </div>

      <h2 className={`relative mt-2 font-display text-5xl font-extrabold leading-none tracking-[-0.04em] sm:text-7xl ${negative ? 'text-coral' : ''}`}>
        {formatNPRSigned(data.balance)}
      </h2>

      <p className="relative mt-4 text-xl text-paper/90">
        {arrow && <span aria-hidden="true">{arrow} </span>}{text}
      </p>
      {negative && <p className="relative mt-2 max-w-xl text-lg text-paper/75">You have spent more than you have earned so far. Small steps help.</p>}

      <Sparkline trend={data.trend} />

      <p className="relative mt-4 flex flex-wrap gap-x-6 gap-y-1 text-lg text-paper/80">
        <span>Money in {formatNPR(last.income)}</span>
        <span>Money out {formatNPR(last.spent)}</span>
        <span className="text-paper/60">(last 30 days)</span>
      </p>
    </section>
  );
};

export default BalanceHero;
