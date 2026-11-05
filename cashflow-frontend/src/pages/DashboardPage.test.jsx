// The dashboard: the balance first, then your money health, then the details.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardPage from './DashboardPage';

const navigate = vi.fn();
let currentUser = { username: 'alice', is_admin: false };

vi.mock('react-router-dom', async (importOriginal) => ({ ...(await importOriginal()), useNavigate: () => navigate }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: currentUser }) }));
vi.mock('../components/dashboard/BalanceHero', () => ({ default: () => <section aria-label="Your balance">hero</section> }));
vi.mock('../components/dashboard/MoneyHealthStrip', () => ({ default: () => <section aria-label="Your money health">strip</section> }));
vi.mock('../components/dashboard/UserDashboard', () => ({ default: () => <section aria-label="Money in and out">details</section> }));
vi.mock('../components/dashboard/RecurringTransactions', () => ({ default: () => <section aria-label="Upcoming expenses">bills</section> }));

const renderPage = () => render(<MemoryRouter><DashboardPage /></MemoryRouter>);
const before = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('DashboardPage', () => {
  beforeEach(() => {
    navigate.mockClear();
    currentUser = { username: 'alice', is_admin: false };
  });

  it('puts the balance first, then the money health, then the details', () => {
    renderPage();
    const [balance, health, details, bills] = ['Your balance', 'Your money health', 'Money in and out', 'Upcoming expenses']
      .map((name) => screen.getByRole('region', { name }));
    expect(before(balance, health)).toBe(true);
    expect(before(health, details)).toBe(true);
    expect(before(details, bills) || before(bills, details)).toBe(true);   // both are below the health strip
    expect(before(health, bills)).toBe(true);
  });

  it('the page title is there, but the balance is the first thing in the content after it', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    const firstRegion = screen.getAllByRole('region')[0];
    expect(firstRegion).toHaveAccessibleName('Your balance');
  });

  it('no longer shows the old financial-health bar', () => {
    renderPage();
    expect(screen.queryByText(/savings rate: /i)).not.toBeInTheDocument();
    expect(screen.queryByText(/status:/i)).not.toBeInTheDocument();
  });

  it('sends an administrator to the admin dashboard, as before', () => {
    currentUser = { username: 'boss', is_admin: true };
    renderPage();
    expect(navigate).toHaveBeenCalledWith('/admin-dashboard');
  });

  it('shows nothing when nobody is signed in', () => {
    currentUser = null;
    const { container } = renderPage();
    expect(container).toBeEmptyDOMElement();
  });
});
