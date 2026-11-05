// The dashboard's focal point: what you have, in one glance. Spec: cashflow-product/docs/specs/money-score.md (BAL-01..BAL-07)
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BalanceHero from './BalanceHero';
import * as service from '../../services/balanceService';

vi.mock('../../services/balanceService');

// 30 points from `from` to `to` (the component only uses the balances, so the dates are labels)
const trend = (from, to) => Array.from({ length: 30 }, (_, i) => ({ date: `day-${i}`, balance: (from + ((to - from) * i) / 29).toFixed(2) }));

const UP = {
  has_data: true,
  balance: '50000.00',
  last_30_days: { start: '2026-10-24', end: '2026-11-22', income: '100000.00', spent: '90000.00', net: '10000.00' },
  change_30d: '10000.00',
  direction: 'up',
  trend: trend(40000, 50000),
};

const user = userEvent.setup();
const renderIt = () => render(<MemoryRouter><BalanceHero /></MemoryRouter>);
const hero = () => screen.findByRole('region', { name: /your balance/i });

describe('BalanceHero', () => {
  beforeEach(() => vi.resetAllMocks());

  it('says it is loading, instead of showing a blank space where the balance will be', () => {
    service.getBalance.mockReturnValue(new Promise(() => {}));
    renderIt();
    expect(screen.getByRole('status')).toHaveTextContent(/checking your balance/i);
  });

  it('shows the balance as the biggest thing: a heading with the amount in NPR', async () => {
    service.getBalance.mockResolvedValue(UP);
    renderIt();
    const card = await hero();
    expect(within(card).getByRole('heading', { level: 2, name: 'NPR 50,000.00' })).toBeInTheDocument();
    expect(card).toHaveTextContent('Your balance');
  });

  it('says in words how it moved over the last 30 days (up)', async () => {
    service.getBalance.mockResolvedValue(UP);
    renderIt();
    expect(await screen.findByText(/up NPR 10,000.00 in the last 30 days/i)).toBeInTheDocument();
  });

  it('says it plainly when it went down, using the size of the drop', async () => {
    service.getBalance.mockResolvedValue({ ...UP, change_30d: '-15000.00', direction: 'down', last_30_days: { ...UP.last_30_days, net: '-15000.00' } });
    renderIt();
    expect(await screen.findByText(/down NPR 15,000.00 in the last 30 days/i)).toBeInTheDocument();
  });

  it('says so when nothing changed', async () => {
    service.getBalance.mockResolvedValue({ ...UP, change_30d: '0.00', direction: 'flat' });
    renderIt();
    expect(await screen.findByText(/no change in the last 30 days/i)).toBeInTheDocument();
  });

  it('shows money in and money out for the same 30 days', async () => {
    service.getBalance.mockResolvedValue(UP);
    renderIt();
    const card = await hero();
    expect(card).toHaveTextContent('Money in NPR 1,00,000.00');
    expect(card).toHaveTextContent('Money out NPR 90,000.00');
  });

  it('draws the 30-day trend and describes it in words for screen readers', async () => {
    service.getBalance.mockResolvedValue(UP);
    renderIt();
    expect(await screen.findByRole('img', { name: /balance over the last 30 days: from NPR 40,000.00 to NPR 50,000.00/i })).toBeInTheDocument();
  });

  it('shows a negative balance with a proper minus sign and a kind message, never a scolding', async () => {
    service.getBalance.mockResolvedValue({ ...UP, balance: '-350.00', direction: 'down', change_30d: '-350.00', trend: trend(0, -350) });
    renderIt();
    const card = await hero();
    expect(within(card).getByRole('heading', { level: 2, name: '−NPR 350.00' })).toBeInTheDocument();
    expect(card).toHaveTextContent(/spent more than you have earned so far/i);
    expect(document.body.textContent).not.toMatch(/critical|poor|bad|fail|danger|broke|overspent|wasted/i);
  });

  it('puts the most common action right next to the number', async () => {
    service.getBalance.mockResolvedValue(UP);
    renderIt();
    const card = await hero();
    expect(within(card).getByRole('link', { name: /add transaction/i })).toHaveAttribute('href', '/transactions');
  });

  it('for a brand-new user it invites them instead of showing a zero balance and an empty chart', async () => {
    service.getBalance.mockResolvedValue({ ...UP, has_data: false, balance: '0.00', change_30d: '0.00', direction: 'flat' });
    renderIt();
    expect(await screen.findByText(/add your first income or expense to see your balance/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add my first transaction/i })).toHaveAttribute('href', '/transactions');
    expect(screen.queryByRole('img', { name: /balance over the last 30 days/i })).not.toBeInTheDocument();
  });

  it('shows a clear message with a Try again button when it cannot load, and retries', async () => {
    service.getBalance.mockRejectedValueOnce(new Error('We could not load your balance. Please try again.'));
    service.getBalance.mockResolvedValueOnce(UP);
    renderIt();
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load your balance/i);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { level: 2, name: 'NPR 50,000.00' })).toBeInTheDocument();
  });
});
