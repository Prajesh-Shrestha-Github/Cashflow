// Spec: cashflow-product/docs/specs/money-score.md (MS-U1 .. MS-U4)
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FinancialHealthPage from './FinancialHealthPage';
import * as service from '../services/moneyScoreService';

vi.mock('../services/moneyScoreService');

const W1 = {
  as_of: '2026-11-22',
  window: { start: '2026-10-24', end: '2026-11-22' },
  streak: { weeks: 3, freeze_used: false, this_week_done: true },
  payday_nudge: null,
  levers: { income: '100000.00', wants: '35000.00', emergency_fund: '82500.00', avg_needs: '55000.00', weeks_logged: 3 },
  status: 'ok',
  score: 60,
  level: { name: 'Sapling', min: 50, max: 74 },
  next_level: { name: 'Tree', at: 75, points_needed: 15 },
  components: [
    { key: 'balance', points: '16.7', max: 25, detail: { needs_pct: '55.0', wants_pct: '35.0' } },
    { key: 'savings', points: '12.5', max: 25, detail: { saved_pct: '10.0' } },
    { key: 'safety_net', points: '12.5', max: 25, detail: { months: '1.5' } },
    { key: 'check_in', points: '18.8', max: 25, detail: { weeks_logged: 3, weeks_elapsed: 4 } },
  ],
  next_steps: [
    { type: 'save_more', points: '12.5', amount: '10000.00' },
    { type: 'build_safety_net', points: '12.5', amount: '82500.00' },
    { type: 'check_in', points: '6.3', amount: null },
  ],
  history: [
    { as_of: '2026-10-18', score: null }, { as_of: '2026-10-25', score: null }, { as_of: '2026-11-01', score: 48 },
    { as_of: '2026-11-08', score: 73 }, { as_of: '2026-11-15', score: 71 }, { as_of: '2026-11-22', score: 60 },
  ],
  disclaimer: 'This is a self-check, not financial advice.',
};

const user = userEvent.setup();
const renderPage = () => render(<MemoryRouter><FinancialHealthPage /></MemoryRouter>);

describe('Money health page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    service.getRecap.mockResolvedValue({ status: 'no_data', as_of: '2026-11-22', highlights: [] });
  });

  it('tells the user it is loading, instead of showing an empty page', () => {
    service.getMoneyScore.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent(/checking your month/i);
  });

  it('MS-U1: shows the score as an accessible ring, with the level and the points to the next one', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    expect(await screen.findByRole('img', { name: /money score: 60 out of 100/i })).toBeInTheDocument();
    expect(screen.getByText('Sapling')).toBeInTheDocument();
    expect(screen.getByText(/15 points to Tree/i)).toBeInTheDocument();
  });

  it('MS-U2: four habit cards, each with points, a progress bar and a plain sentence', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    await screen.findByRole('img', { name: /money score/i });

    const bars = screen.getAllByRole('progressbar');
    expect(bars.map((b) => b.getAttribute('aria-valuenow'))).toEqual(['16.7', '12.5', '12.5', '18.8']);
    expect(screen.getByText(/Must-haves 55%/)).toBeInTheDocument();
    expect(screen.getByText(/Nice-to-haves 35%/)).toBeInTheDocument();
    expect(screen.getByText(/kept 10% of your income/i)).toBeInTheDocument();
    expect(screen.getByText(/covers 1.5 months/i)).toBeInTheDocument();
    expect(screen.getByText(/3 of the last 4 weeks/i)).toBeInTheDocument();   // a rolling window, not "this month"
  });

  it('MS-U3: one prominent next step with the points it earns, and a button that goes where the action happens', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    const card = await screen.findByRole('region', { name: /your next step/i });
    expect(within(card).getByText(/save NPR 10,000.00 more/i)).toBeInTheDocument();
    expect(within(card).getByText('+12.5 points')).toBeInTheDocument(); // exact: the 'Then' steps show '(+12.5 points)'
    expect(within(card).getByRole('link', { name: /plan my savings/i })).toHaveAttribute('href', '/planner');
  });

  it('the other steps are listed after the main one', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    const later = await screen.findByRole('list', { name: /then/i });
    expect(within(later).getAllByRole('listitem')).toHaveLength(2);
    expect(within(later).getByText(/emergency fund|safety net/i)).toBeInTheDocument();
  });

  it('shows the last six weeks as a simple history, leaving empty weeks empty', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    const history = await screen.findByRole('list', { name: /last 6 weeks/i });
    expect(within(history).getAllByRole('listitem')).toHaveLength(6);
    expect(within(history).getByText('60')).toBeInTheDocument();
    expect(within(history).getByText('22 Nov')).toBeInTheDocument();
    expect(within(history).getByText('18 Oct')).toBeInTheDocument();
  });

  it('MS-U5: says exactly which days were scored (a rolling 30-day window, not a calendar month)', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    expect(await screen.findByText(/based on your last 30 days: 24 Oct to 22 Nov/i)).toBeInTheDocument();
  });

  it('no longer shows a "month in progress" warning, because a rolling window is always a full pay cycle', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    await screen.findByRole('img', { name: /money score/i });
    expect(screen.queryByRole('region', { name: /still in progress/i })).not.toBeInTheDocument();
  });

  it('includes the what-if panel', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    expect(await screen.findByRole('heading', { name: /what if/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /nice-to-haves/i })).toBeInTheDocument();
  });

  it('ST: shows the check-in streak in plain words', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    expect(await screen.findByText('3-week streak')).toBeInTheDocument();
  });

  it('ST: reminds you, kindly, to add something this week to keep the streak', async () => {
    service.getMoneyScore.mockResolvedValue({ ...W1, streak: { weeks: 3, freeze_used: false, this_week_done: false } });
    renderPage();
    expect(await screen.findByText(/add something this week to keep it going/i)).toBeInTheDocument();
  });

  it('ST: says when a missed week was forgiven', async () => {
    service.getMoneyScore.mockResolvedValue({ ...W1, streak: { weeks: 4, freeze_used: true, this_week_done: true } });
    renderPage();
    expect(await screen.findByText(/one missed week was forgiven/i)).toBeInTheDocument();
  });

  it('ST: with no streak it invites you to start one instead of showing "0-week"', async () => {
    service.getMoneyScore.mockResolvedValue({ ...W1, streak: { weeks: 0, freeze_used: false, this_week_done: false } });
    renderPage();
    expect(await screen.findByText(/add something this week to start a streak/i)).toBeInTheDocument();
    expect(screen.queryByText(/0-week/)).not.toBeInTheDocument();
  });

  it('PD: shows the pay-yourself-first nudge when a payday was detected', async () => {
    service.getMoneyScore.mockResolvedValue({
      ...W1, payday_nudge: { transaction_id: 9, date: '2026-11-21', income_amount: '100000.00', percent: 20, suggested_amount: '20000.00' },
    });
    renderPage();
    expect(await screen.findByRole('region', { name: /pay yourself first/i })).toHaveTextContent('NPR 20,000.00');
  });

  it('RC: includes the weekly recap', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    service.getRecap.mockResolvedValue({
      status: 'ok', as_of: '2026-11-22', spent: '35000.00', spent_last_week: '15000.00', income: '0.00', entries: 1,
      top_category: { name: 'Entertainment', amount: '35000.00' }, biggest_expense: null, score_now: 60, score_week_ago: 71,
      score_change: -11, streak: W1.streak, highlights: [],
    });
    renderPage();
    expect(await screen.findByRole('region', { name: /your week/i })).toBeInTheDocument();
  });

  it('MS-U4: there is no Recalculate button, because the score is always live', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    await screen.findByRole('img', { name: /money score/i });
    expect(screen.queryByRole('button', { name: /recalculate/i })).not.toBeInTheDocument();
  });

  it('never uses shaming words, even for a very low score', async () => {
    service.getMoneyScore.mockResolvedValue({
      ...W1, score: 6, level: { name: 'Seed', min: 0, max: 24 }, next_level: { name: 'Sprout', at: 25, points_needed: 19 },
      components: W1.components.map((c) => ({ ...c, points: '1.0' })),
    });
    renderPage();
    await screen.findByRole('img', { name: /money score: 6/i });
    expect(document.body.textContent).not.toMatch(/critical|poor|bad|fail|danger|broke/i);
    expect(screen.getByText(/every forest starts with a seed/i)).toBeInTheDocument();
  });

  it('MS-U4: with no data yet it shows a friendly start, not a zero score', async () => {
    service.getMoneyScore.mockResolvedValue({
      as_of: '2026-11-22', window: { start: '2026-10-24', end: '2026-11-22' }, status: 'no_data', score: null, level: null, next_level: null, components: [],
      next_steps: [{ type: 'add_first_transaction', points: null, amount: null }], history: [],
    });
    renderPage();
    expect(await screen.findByText(/let's start your score/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add my first transaction/i })).toHaveAttribute('href', '/transactions');
    expect(screen.queryByRole('img', { name: /money score/i })).not.toBeInTheDocument();
  });

  it('a Forest has nothing left to fix and celebrates instead of nagging', async () => {
    service.getMoneyScore.mockResolvedValue({
      ...W1, score: 100, level: { name: 'Forest', min: 90, max: 100 }, next_level: null, next_steps: [],
      components: W1.components.map((c) => ({ ...c, points: '25.0' })),
    });
    renderPage();
    expect(await screen.findByText(/you are a forest/i)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /your next step/i })).not.toBeInTheDocument();
  });

  it('shows a clear message with a Try again button when the score cannot be loaded', async () => {
    service.getMoneyScore.mockRejectedValueOnce(new Error('We could not load your score. Please try again.'));
    service.getMoneyScore.mockResolvedValueOnce(W1);
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load your score/i);

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('img', { name: /money score: 60/i })).toBeInTheDocument();
  });

  it('always shows the self-check disclaimer', async () => {
    service.getMoneyScore.mockResolvedValue(W1);
    renderPage();
    expect(await screen.findByText(/self-check, not financial advice/i)).toBeInTheDocument();
  });
});
