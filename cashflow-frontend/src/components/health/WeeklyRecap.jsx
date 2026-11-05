// "Your week": a 30-second recap of the last 7 days against the 7 before. Gentle wording, never shaming.
// Spec: cashflow-product/docs/specs/money-score.md (RC-01..RC-04)
import { useCallback, useEffect, useState } from 'react';

import { getRecap } from '../../services/moneyScoreService';
import { formatNPR } from '../../utils/formatMoney';

const SENTENCES = {
  score_up: (h) => `Your score went up by ${h.points} points.`,
  score_down: (h) => `Your score is ${h.points} points lower than last week. A small change can bring it back.`,
  spent_less: (h) => `You spent ${formatNPR(h.amount)} less than last week. Nice!`,
  spent_more: (h) => `You spent ${formatNPR(h.amount)} more than last week.`,
  streak: (h) => `${h.weeks} weeks in a row: keep it going!`,
  no_entries: () => 'Nothing logged this week yet. Add one entry to keep your streak.',
};

const WeeklyRecap = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getRecap());
    } catch (e) {
      setError(e.message || 'We could not load your week. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p role="status" className="text-lg text-ink-mute">Loading your week...</p>;

  if (error) {
    return (
      <div role="alert" className="card-pad">
        <p className="text-lg font-medium text-signal">{error}</p>
        <button type="button" onClick={load} className="btn-ghost mt-3 px-5 py-2.5 text-base">Try again</button>
      </div>
    );
  }

  if (!data || data.status !== 'ok') {
    return (
      <div className="card-pad">
        <h2 className="font-display text-2xl font-bold tracking-tight">Your week</h2>
        <p className="mt-2 text-lg text-ink-soft">Add something this week and your recap shows up here.</p>
      </div>
    );
  }

  return (
    <section aria-label="Your week" className="card-pad">
      <h2 className="font-display text-2xl font-bold tracking-tight">Your week</h2>
      <p className="mt-3 text-lg text-ink">
        You spent <strong>{formatNPR(data.spent)}</strong> (last week: {formatNPR(data.spent_last_week)}).
      </p>
      {data.top_category && (
        <p className="mt-1 text-base text-ink-soft">Most of it went to {data.top_category.name} ({formatNPR(data.top_category.amount)}).</p>
      )}
      {Number(data.income) > 0 && <p className="mt-1 text-base text-ink-soft">Money in this week: {formatNPR(data.income)}.</p>}
      {data.highlights.length > 0 && (
        <ul aria-label="Highlights" className="mt-4 space-y-2 border-t border-line pt-4 text-lg">
          {data.highlights.map((h) => <li key={h.type}>{SENTENCES[h.type](h)}</li>)}
        </ul>
      )}
    </section>
  );
};

export default WeeklyRecap;
