// "Pay yourself first": when a big income arrives, suggest moving 20% to savings before it is spent.
// "I moved it" is remembered in this browser only (one key per payday), so it is never nagging and never needs the server.
// Spec: cashflow-product/docs/specs/money-score.md (PD-01, PD-02)
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { formatNPR } from '../../utils/formatMoney';

const keyFor = (id) => `paydayDone:${id}`;
const wasDone = (id) => {
  try {
    return localStorage.getItem(keyFor(id)) === '1';
  } catch {
    return false; // storage blocked: just show it
  }
};
const markDone = (id) => {
  try {
    localStorage.setItem(keyFor(id), '1');
  } catch {
    /* blocked: it will be hidden for this visit only */
  }
};

const PaydayNudge = ({ nudge }) => {
  const [done, setDone] = useState(() => (nudge ? wasDone(nudge.transaction_id) : false));
  if (!nudge || done) return null;

  return (
    <section aria-label="Pay yourself first" className="rounded-3xl border-2 border-accent bg-accent-tint p-5 sm:p-6">
      <h2 className="font-display text-2xl font-bold tracking-tight">Pay yourself first</h2>
      <p className="mt-2 text-lg text-ink">
        Your income of {formatNPR(nudge.income_amount)} arrived. Move {formatNPR(nudge.suggested_amount)} ({nudge.percent}%) to savings before you spend it.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            markDone(nudge.transaction_id);
            setDone(true);
          }}
          className="btn-primary px-5 py-3 text-base"
        >
          I moved it
        </button>
        <Link to="/planner" className="btn-ghost px-5 py-3 text-base">Plan my savings</Link>
      </div>
    </section>
  );
};

export default PaydayNudge;
