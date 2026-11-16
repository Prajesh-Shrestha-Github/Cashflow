// The Money Score at a glance on the dashboard: score, level, streak, ONE next step. Payday nudge sits above it.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MoneyHealthStrip from './MoneyHealthStrip';
import * as service from '../../services/moneyScoreService';

vi.mock('../../services/moneyScoreService');

const SCORE = {
  status: 'ok',
  score: 60,
  level: { name: 'Sapling', min: 50, max: 74 },
  next_level: { name: 'Tree', at: 75, points_needed: 15 },
  streak: { weeks: 3, freeze_used: false, this_week_done: true },
  payday_nudge: null,
  next_steps: [{ type: 'save_more', points: '12.5', amount: '10000.00' }],
};

const user = userEvent.setup();
const renderIt = () => render(<MemoryRouter><MoneyHealthStrip /></MemoryRouter>);

describe('MoneyHealthStrip', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('shows the score, the level and the points to the next level', async () => {
    service.getMoneyScore.mockResolvedValue(SCORE);
    renderIt();
    const card = await screen.findByRole('region', { name: /your money health/i });
    expect(card).toHaveTextContent('60');
    expect(card).toHaveTextContent('Sapling');
    expect(card).toHaveTextContent('15 points to Tree');
  });

  it('shows the streak', async () => {
    service.getMoneyScore.mockResolvedValue(SCORE);
    renderIt();
    expect(await screen.findByText('3-week streak')).toBeInTheDocument();
  });

  it('shows exactly ONE next step, with the points it earns, and a button that goes there', async () => {
    service.getMoneyScore.mockResolvedValue({
      ...SCORE,
      next_steps: [{ type: 'save_more', points: '12.5', amount: '10000.00' }, { type: 'check_in', points: '6.3', amount: null }],
    });
    renderIt();
    const card = await screen.findByRole('region', { name: /your money health/i });
    expect(within(card).getByText(/save NPR 10,000.00 more/i)).toBeInTheDocument();
    expect(card).toHaveTextContent('+12.5 points');
    expect(within(card).getByRole('link', { name: /plan my savings/i })).toHaveAttribute('href', '/planner');
    expect(within(card).queryByText(/add what you spent this week/i)).not.toBeInTheDocument();
  });

  it('links to the full Money Health page', async () => {
    service.getMoneyScore.mockResolvedValue(SCORE);
    renderIt();
    expect(await screen.findByRole('link', { name: /see my money health/i })).toHaveAttribute('href', '/financial-health');
  });

  it('a Forest with nothing left to fix is congratulated, not nagged', async () => {
    service.getMoneyScore.mockResolvedValue({ ...SCORE, score: 100, level: { name: 'Forest', min: 90, max: 100 }, next_level: null, next_steps: [] });
    renderIt();
    expect(await screen.findByText(/you are a forest/i)).toBeInTheDocument();
  });

  it('shows the pay-yourself-first nudge above the strip when a payday was detected', async () => {
    service.getMoneyScore.mockResolvedValue({
      ...SCORE, payday_nudge: { transaction_id: 9, date: '2026-11-21', income_amount: '100000.00', percent: 20, suggested_amount: '20000.00' },
    });
    renderIt();
    const nudge = await screen.findByRole('region', { name: /pay yourself first/i });
    const strip = screen.getByRole('region', { name: /your money health/i });
    expect(nudge.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('without a score yet it invites the user instead of showing zeros', async () => {
    service.getMoneyScore.mockResolvedValue({ status: 'no_income', score: null, level: null, next_level: null, streak: null, payday_nudge: null, next_steps: [{ type: 'add_income', points: null, amount: null }] });
    renderIt();
    expect(await screen.findByText(/add your income and spending to get your money score/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add my income/i })).toHaveAttribute('href', '/transactions');
  });

  it('shows a quiet message with a retry when it cannot load', async () => {
    service.getMoneyScore.mockRejectedValueOnce(new Error('We could not load your score. Please try again.'));
    service.getMoneyScore.mockResolvedValueOnce(SCORE);
    renderIt();
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load your money score/i);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('region', { name: /your money health/i })).toBeInTheDocument();
  });

  it('never uses shaming words', async () => {
    service.getMoneyScore.mockResolvedValue(SCORE);
    renderIt();
    await screen.findByRole('region', { name: /your money health/i });
    expect(document.body.textContent).not.toMatch(/critical|poor|bad|fail|danger|broke/i);
  });
});
