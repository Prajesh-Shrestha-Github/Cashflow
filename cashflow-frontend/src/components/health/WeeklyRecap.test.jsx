// Spec: cashflow-product/docs/specs/money-score.md (RC-01..RC-04)
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import WeeklyRecap from './WeeklyRecap';
import * as service from '../../services/moneyScoreService';

vi.mock('../../services/moneyScoreService');

const RECAP = {
  status: 'ok',
  as_of: '2026-11-22',
  spent: '35000.00',
  spent_last_week: '15000.00',
  income: '0.00',
  entries: 1,
  top_category: { name: 'Entertainment', amount: '35000.00' },
  biggest_expense: { category: 'Entertainment', amount: '35000.00', description: null },
  score_now: 60,
  score_week_ago: 71,
  score_change: -11,
  streak: { weeks: 3, freeze_used: false, this_week_done: true },
  highlights: [{ type: 'score_down', points: 11 }, { type: 'spent_more', amount: '20000.00' }, { type: 'streak', weeks: 3 }],
};

const user = userEvent.setup();

describe('WeeklyRecap', () => {
  beforeEach(() => vi.resetAllMocks());

  it('shows a loading message first', () => {
    service.getRecap.mockReturnValue(new Promise(() => {}));
    render(<WeeklyRecap />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading your week/i);
  });

  it('RC-01: shows what you spent now and last week, and where it went', async () => {
    service.getRecap.mockResolvedValue(RECAP);
    render(<WeeklyRecap />);
    const card = await screen.findByRole('region', { name: /your week/i });
    expect(card).toHaveTextContent('You spent NPR 35,000.00');
    expect(card).toHaveTextContent('last week: NPR 15,000.00');
    expect(card).toHaveTextContent('Entertainment');
  });

  it('RC-03: turns each highlight into a plain sentence', async () => {
    service.getRecap.mockResolvedValue(RECAP);
    render(<WeeklyRecap />);
    const list = await screen.findByRole('list', { name: /highlights/i });
    const items = within(list).getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toMatch(/11 points lower than last week/i);
    expect(items[1]).toMatch(/NPR 20,000.00 more than last week/i);
    expect(items[2]).toMatch(/3 weeks in a row/i);
  });

  it('celebrates spending less and a rising score', async () => {
    service.getRecap.mockResolvedValue({
      ...RECAP, highlights: [{ type: 'score_up', points: 6 }, { type: 'spent_less', amount: '5000.00' }],
    });
    render(<WeeklyRecap />);
    const list = await screen.findByRole('list', { name: /highlights/i });
    expect(list).toHaveTextContent(/went up by 6 points/i);
    expect(list).toHaveTextContent(/NPR 5,000.00 less than last week/i);
  });

  it('gently nudges when nothing was logged this week', async () => {
    service.getRecap.mockResolvedValue({ ...RECAP, entries: 0, spent: '0.00', top_category: null, biggest_expense: null, highlights: [{ type: 'no_entries' }] });
    render(<WeeklyRecap />);
    expect(await screen.findByText(/nothing logged this week yet/i)).toBeInTheDocument();
  });

  it('RC-04: with no data it invites the user instead of showing zeros', async () => {
    service.getRecap.mockResolvedValue({ status: 'no_data', as_of: '2026-11-22', highlights: [] });
    render(<WeeklyRecap />);
    expect(await screen.findByText(/add something this week/i)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /your week/i })).not.toBeInTheDocument();
  });

  it('shows a quiet message with a retry when it cannot load, and retries', async () => {
    service.getRecap.mockRejectedValueOnce(new Error('We could not load your week. Please try again.'));
    service.getRecap.mockResolvedValueOnce(RECAP);
    render(<WeeklyRecap />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load your week/i);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('region', { name: /your week/i })).toBeInTheDocument();
  });

  it('never uses shaming words', async () => {
    service.getRecap.mockResolvedValue(RECAP);
    render(<WeeklyRecap />);
    await screen.findByRole('region', { name: /your week/i });
    expect(document.body.textContent).not.toMatch(/critical|poor|bad|fail|danger|broke|overspent|wasted/i);
  });
});
