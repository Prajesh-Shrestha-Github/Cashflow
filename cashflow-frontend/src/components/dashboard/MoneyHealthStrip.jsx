// The Money Score at a glance: score, level, streak and ONE next step. A payday nudge sits above it.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import PaydayNudge from '../health/PaydayNudge';
import StepButton from '../health/StepButton';
import { STEPS, trimZero } from '../health/steps';
import { getMoneyScore } from '../../services/moneyScoreService';

const MoneyHealthStrip = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await getMoneyScore());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p role="status" className="text-lg text-ink-mute">Checking your Money Score...</p>;

  if (error) {
    return (
      <div role="alert" className="card-pad">
        <p className="text-lg font-medium text-signal">We could not load your Money Score.</p>
        <button type="button" onClick={load} className="btn-ghost mt-3 px-5 py-2.5 text-base">Try again</button>
      </div>
    );
  }

  if (!data || data.status !== 'ok') {
    const step = data?.next_steps?.[0];
    return (
      <div className="card-pad flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg text-ink">Add your income and spending to get your Money Score.</p>
        {step && <StepButton step={step} />}
      </div>
    );
  }

  const [main] = data.next_steps;
  const forest = data.next_level === null;
  return (
    <>
      <PaydayNudge nudge={data.payday_nudge} />
      <section aria-label="Your money health" className="card-pad">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
          <div>
            <p className="text-lg text-ink-mute">Money Score</p>
            <p className="font-display text-6xl font-extrabold leading-none tracking-[-0.04em]">{data.score}</p>
            <p className="mt-2 text-lg font-semibold">{data.level.name}</p>
            <p className="text-base text-ink-soft">{forest ? 'You are a Forest!' : `${data.next_level.points_needed} points to ${data.next_level.name}`}</p>
            {data.streak?.weeks > 0 && (
              <p className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-base font-semibold text-forest-deep">{data.streak.weeks}-week streak</p>
            )}
          </div>

          <div className="min-w-0 flex-1 basis-72">
            {main ? (
              <>
                <p className="text-lg font-semibold">Your next step</p>
                <p className="mt-1 text-xl text-ink">{STEPS[main.type].text(main)}</p>
                {main.points && <p className="mt-1 text-base font-semibold text-brand">+{trimZero(main.points)} points</p>}
                <div className="mt-3"><StepButton step={main} className="btn-primary px-5 py-3 text-base" /></div>
              </>
            ) : (
              <p className="text-xl text-ink">Your habits are all strong. Just keep checking in.</p>
            )}
          </div>

          <Link to="/financial-health" className="btn-ghost px-5 py-3 text-base">See my money health</Link>
        </div>
      </section>
    </>
  );
};

export default MoneyHealthStrip;
