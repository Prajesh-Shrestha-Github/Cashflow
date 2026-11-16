// The dashboard's detail section (period summary and charts). The main balance lives in BalanceHero, not here.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserDashboard from './UserDashboard';
import api from '../../services/api';

vi.mock('../../services/api');
vi.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="chart-doughnut" />,
  Line: () => <div data-testid="chart-line" />,
  Bar: () => <div data-testid="chart-bar" />,
}));

// The backend currently sends money as JSON numbers (bug #13), so these are numbers on purpose.
const DATA = {
  stats: { total_income: 9000, total_expense: 350, balance: 8650, income_change: 12, expense_change: -5, savings_rate: 96 },
  category_breakdown: [{ category: 'Transport', amount: 350 }],
  trends: [{ date: '1-Nov', income: 9000, expense: 350 }],
  spending_patterns: [{ day_of_week: 'Mon', average_amount: 350 }],
  insights: [{ title: 'Top Spending Category: Transport', description: 'Your highest spending is in Transport.' }],
  recent_transactions: [{ id: 1, date: '2026-11-01', category: 'Transport', type: 'expense', amount: 350 }],
};

const user = userEvent.setup();

describe('UserDashboard (period summary and charts)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.get.mockResolvedValue({ data: DATA });
  });

  it('shows money in, money out and the savings rate for the chosen period, in NPR', async () => {
    render(<UserDashboard />);
    const card = await screen.findByRole('region', { name: /money in and out/i });
    expect(card).toHaveTextContent('NPR 9,000.00');
    expect(card).toHaveTextContent('NPR 350.00');
    expect(card).toHaveTextContent('96%');
  });

  it('starts with the month and asks the server for it', async () => {
    render(<UserDashboard />);
    await screen.findByRole('region', { name: /money in and out/i });
    expect(api.get).toHaveBeenCalledWith('/dashboard/?period=month');
    expect(screen.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switching to Week or Year asks the server for that period', async () => {
    render(<UserDashboard />);
    await screen.findByRole('region', { name: /money in and out/i });
    await user.click(screen.getByRole('button', { name: 'Week' }));
    expect(api.get).toHaveBeenLastCalledWith('/dashboard/?period=week');
    await user.click(screen.getByRole('button', { name: 'Year' }));
    expect(api.get).toHaveBeenLastCalledWith('/dashboard/?period=year');
  });

  it('does not show a balance: that belongs to the balance hero, and a period toggle must not change it', async () => {
    render(<UserDashboard />);
    await screen.findByRole('region', { name: /money in and out/i });
    expect(screen.queryByText(/balance this/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/NPR 8,650/)).not.toBeInTheDocument();
  });

  it('uses NPR everywhere on the page: no dollar sign is left', async () => {
    render(<UserDashboard />);
    await screen.findByRole('region', { name: /money in and out/i });
    expect(document.body.textContent).not.toContain('$');
  });

  it('shows the recent transactions with NPR amounts', async () => {
    render(<UserDashboard />);
    const table = await screen.findByRole('table');
    expect(within(table).getByText('NPR 350.00')).toBeInTheDocument();
  });

  it('shows the four charts and the insights', async () => {
    render(<UserDashboard />);
    await screen.findByRole('region', { name: /money in and out/i });
    expect(screen.getByTestId('chart-doughnut')).toBeInTheDocument();
    expect(screen.getByTestId('chart-line')).toBeInTheDocument();
    expect(screen.getByTestId('chart-bar')).toBeInTheDocument();
    expect(screen.getByText(/top spending category: transport/i)).toBeInTheDocument();
  });

  it('says what went wrong when the dashboard cannot be loaded', async () => {
    api.get.mockRejectedValue(new Error('network'));
    render(<UserDashboard />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to fetch dashboard data/i);
  });
});
