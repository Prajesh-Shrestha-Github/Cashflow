// "What if...?": move a slider, see the score you would get. Nothing is saved.
// The score itself is worked out by the server (one set of formulas); this only asks and shows.
// Spec: cashflow-product/docs/specs/money-score.md (WI-U1..WI-U4)
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { saveWhatIfAsGoals, whatIf } from '../../services/moneyScoreService';
import { formatNPR } from '../../utils/formatMoney';

const DEBOUNCE_MS = 150;
const NONE = { wants: 0, income: 0, emergency: 0, checkIn: false };

const whole = (value) => Math.round(Number(value));
const stepFor = (max) => (max >= 5000 ? 500 : 100);
const unchanged = (v) => v.wants === 0 && v.income === 0 && v.emergency === 0 && !v.checkIn;

// Only what the user changed is sent.
const payloadFor = (v) => {
  const body = {};
  if (v.wants !== 0) body.wants_delta = String(v.wants);
  if (v.income !== 0) body.income_delta = String(v.income);
  if (v.emergency !== 0) body.emergency_delta = String(v.emergency);
  if (v.checkIn) body.check_in_every_week = true;
  return body;
};

const readable = (value, less = 'less', more = 'more') =>
  value === 0 ? 'No change' : `${formatNPR(String(Math.abs(value)))} ${value < 0 ? less : more}`;

function Slider({ id, label, value, min, max, step, onChange, disabled, reason }) {
  const text = readable(value);
  return (
    <div>
      <label htmlFor={id} className="label mb-0.5 text-base">{label}</label>
      <output htmlFor={id} className="block font-mono text-lg font-semibold tabular-nums text-ink">{text}</output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={text}
        className="mt-2 h-3 w-full cursor-pointer accent-brand disabled:cursor-not-allowed disabled:opacity-50"
      />
      {disabled && reason && <p className="mt-1 text-base text-ink-mute">{reason}</p>}
    </div>
  );
}

const WhatIf = ({ levers }) => {
  const wants = whole(levers.wants);
  const income = whole(levers.income);
  const safetyMax = 3 * whole(levers.avg_needs); // three months of essentials
  // A range input only allows min + k*step, so the range must start on a multiple of the step:
  // otherwise 0 ("no change") is not a real position and the thumb snaps to some odd value.
  const wantsStep = stepFor(wants);
  const wantsMin = -Math.floor(wants / wantsStep) * wantsStep || 0;
  const wantsMax = Math.floor(wants / 2 / wantsStep) * wantsStep;
  const allWeeks = levers.weeks_logged >= 4;

  const [values, setValues] = useState(NONE);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const latest = useRef(0); // a newer question makes older answers irrelevant
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [saveError, setSaveError] = useState('');

  const set = (name) => (value) => setValues((v) => ({ ...v, [name]: value }));

  useEffect(() => {
    latest.current += 1;
    const ticket = latest.current;
    setSaved(null); // trying something different makes an earlier "saved" message stale
    setSaveError('');
    if (unchanged(values)) {
      setResult(null);
      setError('');
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const answer = await whatIf(payloadFor(values));
        if (ticket === latest.current) {
          setResult(answer);
          setError('');
        }
      } catch (e) {
        if (ticket === latest.current) setError(e.message || 'We could not work that out. Please try again.');
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer); // dragging fast = one request, not one per pixel
  }, [values]);

  // Only money changes can become goals: spending MORE or the check-in switch alone cannot.
  const moneyLever = values.wants < 0 || values.income > 0 || values.emergency > 0;

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      setSaved(await saveWhatIfAsGoals(payloadFor(values)));
    } catch (e) {
      setSaveError(e.message || 'We could not save that goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const change = result?.change?.score ?? 0;
  const newLevel = result?.scenario?.level?.name;
  const levelChanged = result?.scenario && newLevel !== result.current.level?.name;

  return (
    <section className="card-pad" aria-label="What if">
      <h2 className="font-display text-2xl font-bold tracking-tight">What if you changed one thing?</h2>
      <p className="mt-1 text-base text-ink-mute">Try a change and watch the score. Nothing is saved.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_minmax(0,16rem)]">
        <div className="space-y-5">
          <Slider
            id="whatif-wants"
            label="Spend on nice-to-haves"
            value={values.wants}
            min={wantsMin}
            max={wantsMax}
            step={wantsStep}
            onChange={set('wants')}
            disabled={wants < wantsStep}
            reason="No nice-to-haves recorded in the last 30 days."
          />
          <Slider
            id="whatif-income"
            label="Earn extra"
            value={values.income}
            min={0}
            max={income}
            step={stepFor(income)}
            onChange={set('income')}
            disabled={income === 0}
          />
          <Slider
            id="whatif-emergency"
            label="Add to emergency fund"
            value={values.emergency}
            min={0}
            max={safetyMax}
            step={stepFor(safetyMax)}
            onChange={set('emergency')}
            disabled={safetyMax === 0}
            reason="Spend on must-haves first, so we can size your safety net."
          />
          <div>
            <label className="flex cursor-pointer items-center gap-3 text-base font-semibold">
              <input
                type="checkbox"
                role="checkbox"
                checked={values.checkIn}
                disabled={allWeeks}
                onChange={(e) => set('checkIn')(e.target.checked)}
                className="h-6 w-6 accent-brand disabled:cursor-not-allowed"
              />
              I check in every week
            </label>
            {allWeeks && <p className="mt-1 text-base text-ink-mute">You already checked in every week.</p>}
          </div>
        </div>

        <div className="space-y-3">
          <div role="status" aria-label="What-if result" aria-live="polite" className="rounded-2xl bg-forest-deep p-5 text-paper">
            {result?.scenario ? (
              <>
                <p className="text-lg text-paper/80">Your score would be <strong className="font-display text-4xl text-paper">{result.scenario.score}</strong></p>
                <p className={`mt-2 text-xl font-semibold ${change < 0 ? 'text-coral' : 'text-mint'}`}>
                  {change === 0 ? 'No change' : change > 0 ? `+${change} points` : `−${Math.abs(change)} points`}
                </p>
                <p className="mt-2 text-base text-paper/80">{levelChanged ? `You would reach ${newLevel}!` : newLevel}</p>
              </>
            ) : (
              <p className="text-lg text-paper/80">Move a slider to see what happens.</p>
            )}
          </div>
          {error && <p role="alert" className="text-base font-medium text-signal">{error}</p>}
          {result?.scenario && moneyLever && !saved && (
            <button type="button" onClick={save} disabled={saving} className="btn-accent w-full py-3 text-base">
              {saving ? 'Saving...' : 'Make this my goal'}
            </button>
          )}
          {saved && (
            <p className="text-base font-medium text-brand">
              {saved.created.length > 0
                ? `Goal saved: ${saved.created.map((g) => g.title).join(' · ')}`
                : 'You already have this goal.'}{' '}
              <Link to="/goals" className="underline underline-offset-4">See my goals</Link>
            </p>
          )}
          {saveError && <p role="alert" className="text-base font-medium text-signal">{saveError}</p>}
          <button type="button" onClick={() => setValues(NONE)} className="btn-ghost w-full">Reset</button>
        </div>
      </div>
    </section>
  );
};

export default WhatIf;
