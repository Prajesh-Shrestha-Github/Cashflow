// Spec: cashflow-product/docs/specs/money-score.md (PD-01, PD-02). "I moved it" is remembered in the browser only.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PaydayNudge from './PaydayNudge';

const NUDGE = { transaction_id: 42, date: '2026-11-21', income_amount: '100000.00', percent: 20, suggested_amount: '20000.00' };
const user = userEvent.setup();
const renderIt = (props = {}) => render(<MemoryRouter><PaydayNudge nudge={NUDGE} {...props} /></MemoryRouter>);

describe('PaydayNudge', () => {
  beforeEach(() => localStorage.clear());

  it('shows nothing when there is no payday', () => {
    const { container } = render(<MemoryRouter><PaydayNudge nudge={null} /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
  });

  it('says what arrived and exactly how much to move, in plain words', () => {
    renderIt();
    const region = screen.getByRole('region', { name: /pay yourself first/i });
    expect(region).toHaveTextContent('NPR 1,00,000.00');
    expect(region).toHaveTextContent('Move NPR 20,000.00 (20%) to savings');
  });

  it('offers a way to plan the savings', () => {
    renderIt();
    expect(screen.getByRole('link', { name: /plan my savings/i })).toHaveAttribute('href', '/planner');
  });

  it('"I moved it" hides the nudge and remembers it for next time', async () => {
    renderIt();
    await user.click(screen.getByRole('button', { name: /i moved it/i }));
    expect(screen.queryByRole('region', { name: /pay yourself first/i })).not.toBeInTheDocument();
    expect(localStorage.getItem('paydayDone:42')).toBe('1');
  });

  it('stays hidden after a reload once the user said they moved it', () => {
    localStorage.setItem('paydayDone:42', '1');
    renderIt();
    expect(screen.queryByRole('region', { name: /pay yourself first/i })).not.toBeInTheDocument();
  });

  it('a different payday is a new nudge, even if an earlier one was done', () => {
    localStorage.setItem('paydayDone:41', '1');
    renderIt();
    expect(screen.getByRole('region', { name: /pay yourself first/i })).toBeInTheDocument();
  });

  it('still works when the browser blocks storage (private mode)', async () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    renderIt();
    expect(screen.getByRole('region', { name: /pay yourself first/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /i moved it/i }));
    expect(screen.queryByRole('region', { name: /pay yourself first/i })).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('never shames: the wording is encouraging', () => {
    renderIt();
    expect(document.body.textContent).not.toMatch(/critical|poor|bad|fail|danger|broke|should have/i);
  });
});
