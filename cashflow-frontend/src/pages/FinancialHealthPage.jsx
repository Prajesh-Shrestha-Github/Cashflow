// Money health: a friendly 0-100 score, a growth level, ONE next step, and four habits.
// Spec: cashflow-product/docs/specs/money-score.md. A self-check, not financial advice.
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import ScoreRing from '../components/health/ScoreRing';
import PaydayNudge from '../components/health/PaydayNudge';
import StepButton from '../components/health/StepButton';
import WeeklyRecap from '../components/health/WeeklyRecap';
import WhatIf from '../components/health/WhatIf';
import { STEPS, trimZero } from '../components/health/steps';
import { getMoneyScore } from '../services/moneyScoreService';

const LEVEL_MESSAGES = {
  Seed: 'Every forest starts with a seed. Small steps count.',
  Sprout: 'You are growing. Keep going.',
  Sapling: 'Good habits are taking root.',
  Tree: 'Strong and steady.',
  Forest: 'Beautiful work. Keep it up.',
};

const pct = (value) => `${Math.round(Number(value))}%`;

const HABITS = {
  balance: {
    title: 'Spend wisely',
    line: (d) => `Must-haves ${pct(d.needs_pct)} · Nice-to-haves ${pct(d.wants_pct)} of your income (goal: 50% and 30%)`,
  },
  savings: {
    title: 'Save 20%',
    line: (d) =>
      Number(d.saved_pct) > 0
        ? `You kept ${pct(d.saved_pct)} of your income (goal: 20%)`
        : 'You spent more than you earned this month (goal: keep 20%)',
  },
  safety_net: {
    title: 'Safety net',
    line: (d) => `Your emergency fund covers ${trimZero(d.months)} months of essentials (goal: 3)`,
  },
  check_in: {
    title: 'Check in weekly',
    line: (d) => `You checked in during ${d.weeks_logged} of the last ${d.weeks_elapsed} weeks`,
  },
};

const status = (points) => (Number(points) >= 22.5 ? 'On track' : Number(points) >= 10 ? 'Growing' : 'Just starting');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

function Streak({ streak }) {
  if (!streak) return null;
  const { weeks, freeze_used: freezeUsed, this_week_done: thisWeekDone } = streak;
  const notes = [];
  if (weeks === 0) notes.push('Add something this week to start a streak.');
  else if (!thisWeekDone) notes.push('Add something this week to keep it going.');
  if (freezeUsed) notes.push('One missed week was forgiven.');
  return (
    <div className="mt-4">
      {weeks > 0 && <p className="inline-block rounded-full bg-accent px-4 py-1.5 text-lg font-semibold text-forest-deep">{weeks}-week streak</p>}
      {notes.map((n) => <p key={n} className="mt-2 text-base text-paper/80">{n}</p>)}
    </div>
  );
}

function Habit({ habit }) {
  const config = HABITS[habit.key];
  return (
    <div className="card-pad">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl font-bold tracking-tight">{config.title}</h3>
        <span className="font-mono text-base tabular-nums text-ink-mute">{trimZero(habit.points)}/{habit.max}</span>
      </div>
      <div
        role="progressbar"
        aria-label={config.title}
        aria-valuenow={habit.points}
        aria-valuemin={0}
        aria-valuemax={habit.max}
        className="mt-3 h-3 rounded-full bg-paper"
      >
        <div className="h-3 rounded-full bg-brand" style={{ width: `${(Number(habit.points) / habit.max) * 100}%` }} />
      </div>
      <p className="mt-3 text-base text-ink-soft">{config.line(habit.detail)}</p>
      <p className="mt-1 text-base font-semibold text-brand">{status(habit.points)}</p>
    </div>
  );
}

function History({ history }) {
  return (
    <div className="card-pad">
      <h3 className="font-display text-2xl font-bold tracking-tight">Your last 6 weeks</h3>
      <ul aria-label="Your last 6 weeks" className="mt-4 flex h-40 items-end gap-3">
        {history.map((h) => (
          <li key={h.as_of} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="font-mono text-base tabular-nums">{h.score ?? '–'}</span>
            <div
              className={`w-full rounded-t-lg ${h.score === null ? 'border-2 border-dashed border-line' : 'bg-brand'}`}
              style={{ height: `${h.score === null ? 8 : Math.max(6, h.score)}%` }}
            />
            <span className="text-base text-ink-mute">{shortDate(h.as_of)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ data }) {
  const step = data.next_steps[0];
  return (
    <div className="card-pad max-w-2xl">
      <h2 className="font-display text-3xl font-bold tracking-tight">{"Let's start your score"}</h2>
      <p className="mt-2 text-lg text-ink-soft">{STEPS[step.type].text(step)}</p>
      <div className="mt-6"><StepButton step={step} /></div>
    </div>
  );
}

function Score({ data }) {
  const [main, ...later] = data.next_steps;
  const isForest = data.next_level === null;
  return (
    <div className="space-y-5">
      <PaydayNudge nudge={data.payday_nudge} />
      <p className="text-base text-ink-mute">Based on your last 30 days: {shortDate(data.window.start)} to {shortDate(data.window.end)}</p>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-3xl bg-forest-deep p-6 text-paper sm:p-8" aria-label="Your score">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand/40" />
          <div className="relative flex flex-wrap items-center gap-8">
            <ScoreRing score={data.score} />
            <div className="min-w-0">
              <p className="font-display text-5xl font-extrabold tracking-[-0.03em]">{data.level.name}</p>
              <p className="mt-2 text-xl text-paper/85">
                {isForest ? 'You are a Forest!' : `${data.next_level.points_needed} points to ${data.next_level.name}`}
              </p>
              <p className="mt-3 max-w-xs text-lg text-paper/70">{LEVEL_MESSAGES[data.level.name]}</p>
              <Streak streak={data.streak} />
            </div>
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          {data.components.map((habit) => <Habit key={habit.key} habit={habit} />)}
        </div>

        <WhatIf levers={data.levers} />
      </div>

      <div className="space-y-5">
        {main ? (
          <section aria-label="Your next step" className="rounded-3xl bg-accent p-6 text-forest-deep sm:p-8">
            <h2 className="font-display text-2xl font-bold tracking-tight">Your next step</h2>
            <p className="mt-3 text-xl font-medium">{STEPS[main.type].text(main)}</p>
            {main.points && <p className="mt-2 text-lg font-semibold">+{trimZero(main.points)} points</p>}
            <div className="mt-5"><StepButton step={main} className="btn-primary px-6 py-3 text-lg" /></div>
            {later.length > 0 && (
              <div className="mt-6 border-t border-forest-deep/20 pt-4">
                <ul aria-label="Then" className="space-y-2 text-base">
                  {later.map((s) => (
                    <li key={s.type}>
                      <span className="font-semibold">Then: </span>{STEPS[s.type].text(s)}
                      {s.points && <span className="text-forest-deep/70"> (+{trimZero(s.points)} points)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ) : (
          <section className="card-pad">
            <h2 className="font-display text-2xl font-bold tracking-tight">Nothing to fix</h2>
            <p className="mt-2 text-lg text-ink-soft">Your habits are all strong this month. Just keep checking in.</p>
          </section>
        )}
        <WeeklyRecap />
        <History history={data.history} />
      </div>
    </div>
    </div>
  );
}

const FinancialHealthPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getMoneyScore());
    } catch (e) {
      setError(e.message || 'We could not load your score. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Your money health" />

      {loading && <p role="status" className="text-lg text-ink-mute">Checking your month...</p>}

      {!loading && error && (
        <div role="alert" className="card-pad max-w-xl">
          <p className="text-lg font-medium text-signal">{error}</p>
          <button type="button" onClick={load} className="btn-primary mt-4 px-5 py-3 text-base">Try again</button>
        </div>
      )}

      {!loading && !error && data && (data.status === 'ok' ? <Score data={data} /> : <Empty data={data} />)}

      {!loading && !error && data && (
        <p className="mt-6 rounded-2xl bg-accent-tint p-4 text-base text-forest">{data.disclaimer ?? 'This is a self-check, not financial advice.'}</p>
      )}
    </div>
  );
};

export default FinancialHealthPage;
