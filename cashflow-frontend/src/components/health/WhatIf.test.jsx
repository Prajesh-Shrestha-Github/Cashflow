// Spec: cashflow-product/docs/specs/money-score.md (WI-U1 .. WI-U4)
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import WhatIf from './WhatIf';
import * as service from '../../services/moneyScoreService';

vi.mock('../../services/moneyScoreService');

const LEVERS = { income: '100000.00', wants: '35000.00', emergency_fund: '82500.00', avg_needs: '55000.00', weeks_logged: 3 };

const result = (score, change, level = 'Sapling', current = 'Sapling') => ({
  status: 'ok',
  current: { score: 60, level: { name: current } },
  scenario: { score, level: { name: level }, next_level: null, components: [] },
  change: { score: change },
  effective: {},
});

const user = userEvent.setup();
const renderIt = (props = {}) => render(<MemoryRouter><WhatIf levers={LEVERS} {...props} /></MemoryRouter>);
const slider = (name) => screen.getByRole('slider', { name });
const move = (name, value) => fireEvent.change(slider(name), { target: { value: String(value) } });
// The big number is its own element, so read the whole result region instead of one text node.
const resultText = () => screen.getByRole('status', { name: /what-if result/i }).textContent;

describe('WhatIf panel', () => {
  beforeEach(() => vi.resetAllMocks());

  it('WI-U1: has a labelled slider for each lever and a check-in switch, and asks the user to try one', () => {
    renderIt();
    expect(slider(/nice-to-haves/i)).toBeInTheDocument();
    expect(slider(/earn extra/i)).toBeInTheDocument();
    expect(slider(/emergency fund/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /check in every week/i })).toBeInTheDocument();
    expect(screen.getByText(/move a slider/i)).toBeInTheDocument();
    expect(service.whatIf).not.toHaveBeenCalled();   // nothing is asked until the user changes something
  });

  it('WI-U1: every slider shows a readable value, not just a position', () => {
    renderIt();
    expect(slider(/nice-to-haves/i)).toHaveAttribute('aria-valuetext', 'No change');
    move(/nice-to-haves/i, -5000);
    expect(slider(/nice-to-haves/i)).toHaveAttribute('aria-valuetext', 'NPR 5,000.00 less');
    move(/earn extra/i, 20000);
    expect(slider(/earn extra/i)).toHaveAttribute('aria-valuetext', 'NPR 20,000.00 more');
  });

  it('WI-U1: the nice-to-haves slider can go from "cut everything" up to spending 50% more', () => {
    renderIt();
    expect(slider(/nice-to-haves/i)).toHaveAttribute('min', '-35000');
    expect(slider(/nice-to-haves/i)).toHaveAttribute('max', '17500');
    expect(slider(/emergency fund/i)).toHaveAttribute('max', '165000');   // 3 months of essentials
  });

  it('WI-U1: "no change" (0) is always a real slider position, whatever the amounts are', () => {
    // A range input only allows min + k*step. With min = -6299 and step 500, 0 is NOT allowed and the thumb snaps to +201.
    for (const wants of ['6299.00', '12345.67', '450.00', '35000.00', '99999.99']) {
      const { unmount } = renderIt({ levers: { ...LEVERS, wants } });
      for (const name of [/nice-to-haves/i, /earn extra/i, /emergency fund/i]) {
        const el = slider(name);
        if (el.disabled) continue;
        const [min, step] = [Number(el.getAttribute('min')), Number(el.getAttribute('step'))];
        expect(step).toBeGreaterThan(0);
        expect((0 - min) % step, `${name} with wants ${wants}: min ${min} step ${step}`).toBe(0);
        expect(el.value).toBe('0');
      }
      unmount();
    }
  });

  it('WI-U1: when there is less than one slider step of nice-to-haves, the slider is off instead of useless', () => {
    renderIt({ levers: { ...LEVERS, wants: '60.00' } });
    expect(slider(/nice-to-haves/i)).toBeDisabled();
  });

  it('WI-U2: moving a slider asks the server and shows the new score, the points and the level', async () => {
    service.whatIf.mockResolvedValue(result(71, 11));
    renderIt();
    move(/nice-to-haves/i, -5000);

    const out = await screen.findByRole('status', { name: /what-if result/i });
    await waitFor(() => expect(out).toHaveTextContent(/would be 71/i));
    expect(out).toHaveTextContent('+11 points');
    expect(service.whatIf).toHaveBeenCalledWith({ wants_delta: '-5000' });
  });

  it('WI-U2: sends only the things that were changed', async () => {
    service.whatIf.mockResolvedValue(result(90, 30));
    renderIt();
    move(/emergency fund/i, 82500);
    await user.click(screen.getByRole('checkbox', { name: /check in every week/i }));
    await waitFor(() => expect(service.whatIf).toHaveBeenLastCalledWith({ emergency_delta: '82500', check_in_every_week: true }));
  });

  it('WI-U2: says when a change would reach a new level', async () => {
    service.whatIf.mockResolvedValue(result(81, 21, 'Tree', 'Sapling'));
    renderIt();
    move(/earn extra/i, 20000);
    expect(await screen.findByText(/you would reach tree/i)).toBeInTheDocument();
  });

  it('shows a loss as a loss, in plain words', async () => {
    service.whatIf.mockResolvedValue(result(48, -12));
    renderIt();
    move(/nice-to-haves/i, 10000);
    expect(await screen.findByText('−12 points')).toBeInTheDocument();
  });

  it('WI-U2: a quick drag sends one request, not one per pixel', async () => {
    service.whatIf.mockResolvedValue(result(71, 11));
    renderIt();
    [-1000, -2000, -3000, -4000, -5000].forEach((v) => move(/nice-to-haves/i, v));
    await waitFor(() => expect(service.whatIf).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 300));
    expect(service.whatIf).toHaveBeenCalledTimes(1);
    expect(service.whatIf).toHaveBeenCalledWith({ wants_delta: '-5000' });
  });

  it('shows the LATEST answer even when an older answer arrives last (race condition)', async () => {
    let resolveFirst;
    let resolveSecond;
    service.whatIf
      .mockReturnValueOnce(new Promise((r) => { resolveFirst = r; }))
      .mockReturnValueOnce(new Promise((r) => { resolveSecond = r; }));
    renderIt();

    move(/nice-to-haves/i, -2000);
    await waitFor(() => expect(service.whatIf).toHaveBeenCalledTimes(1));
    move(/nice-to-haves/i, -5000);
    await waitFor(() => expect(service.whatIf).toHaveBeenCalledTimes(2));

    await act(async () => resolveSecond(result(71, 11)));   // the newer answer arrives first
    await act(async () => resolveFirst(result(66, 6)));     // the stale one arrives last
    await waitFor(() => expect(resultText()).toMatch(/would be 71/i));
    expect(resultText()).not.toMatch(/would be 66/i);
  });

  it('WI-U3: Reset puts every control back to "no change" and clears the result', async () => {
    service.whatIf.mockResolvedValue(result(71, 11));
    renderIt();
    move(/nice-to-haves/i, -5000);
    await waitFor(() => expect(resultText()).toMatch(/would be 71/i));

    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(slider(/nice-to-haves/i)).toHaveValue('0');
    expect(resultText()).not.toMatch(/would be 71/i);
    expect(screen.getByText(/move a slider/i)).toBeInTheDocument();
  });

  it('WI-U3: putting every control back by hand also clears the result without asking the server', async () => {
    service.whatIf.mockResolvedValue(result(71, 11));
    renderIt();
    move(/nice-to-haves/i, -5000);
    await waitFor(() => expect(resultText()).toMatch(/would be 71/i));
    service.whatIf.mockClear();

    move(/nice-to-haves/i, 0);
    await waitFor(() => expect(resultText()).not.toMatch(/would be 71/i));
    expect(service.whatIf).not.toHaveBeenCalled();
  });

  it('WI-U4: a lever that cannot help is disabled and says why', () => {
    renderIt({ levers: { ...LEVERS, wants: '0.00', avg_needs: '0.00', weeks_logged: 4 } });
    expect(slider(/nice-to-haves/i)).toBeDisabled();
    expect(screen.getByText(/no nice-to-haves recorded/i)).toBeInTheDocument();
    expect(slider(/emergency fund/i)).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /check in every week/i })).toBeDisabled();
    expect(screen.getByText(/already checked in every week/i)).toBeInTheDocument();
  });

  it('shows a friendly message when the server cannot work it out, and keeps the controls usable', async () => {
    service.whatIf.mockRejectedValue(new Error('We could not work that out. Please try again.'));
    renderIt();
    move(/nice-to-haves/i, -5000);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not work that out/i);
    expect(slider(/nice-to-haves/i)).toBeEnabled();
  });

  describe('"Make this my goal" (SG-01, SG-02)', () => {
    const goal = { id: 7, title: 'Spend NPR 5,000 less on nice-to-haves', goal_type: 'expense_reduction', target_amount: '5000.00', target_date: '2026-12-22' };

    it('is not offered before there is a result', () => {
      renderIt();
      expect(screen.queryByRole('button', { name: /make this my goal/i })).not.toBeInTheDocument();
    });

    it('saves exactly what was tried, and says which goal was created, with a link to it', async () => {
      service.whatIf.mockResolvedValue(result(71, 11));
      service.saveWhatIfAsGoals.mockResolvedValue({ created: [goal], existing: [] });
      renderIt();
      move(/nice-to-haves/i, -5000);
      await user.click(await screen.findByRole('button', { name: /make this my goal/i }));

      expect(service.saveWhatIfAsGoals).toHaveBeenCalledWith({ wants_delta: '-5000' });
      expect(await screen.findByText(/goal saved: spend npr 5,000 less on nice-to-haves/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /see my goals/i })).toHaveAttribute('href', '/goals');
    });

    it('says so, instead of creating a copy, when the goal already exists', async () => {
      service.whatIf.mockResolvedValue(result(71, 11));
      service.saveWhatIfAsGoals.mockResolvedValue({ created: [], existing: [goal] });
      renderIt();
      move(/nice-to-haves/i, -5000);
      await user.click(await screen.findByRole('button', { name: /make this my goal/i }));
      expect(await screen.findByText(/you already have this goal/i)).toBeInTheDocument();
    });

    it('a double-click sends one request, not two (no duplicate goals)', async () => {
      service.whatIf.mockResolvedValue(result(71, 11));
      let finish;
      service.saveWhatIfAsGoals.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
      renderIt();
      move(/nice-to-haves/i, -5000);
      const button = await screen.findByRole('button', { name: /make this my goal/i });
      await user.dblClick(button);
      expect(service.saveWhatIfAsGoals).toHaveBeenCalledTimes(1);
      expect(button).toBeDisabled();
      await act(async () => finish({ created: [goal], existing: [] }));
    });

    it('is not offered when only the check-in switch changed, or when spending more', async () => {
      service.whatIf.mockResolvedValue(result(67, 7));
      renderIt();
      await user.click(screen.getByRole('checkbox', { name: /check in every week/i }));
      await screen.findByRole('status', { name: /what-if result/i });
      await waitFor(() => expect(resultText()).toMatch(/would be 67/i));
      expect(screen.queryByRole('button', { name: /make this my goal/i })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /reset/i }));
      service.whatIf.mockResolvedValue(result(48, -12));
      move(/nice-to-haves/i, 10000);
      await waitFor(() => expect(resultText()).toMatch(/would be 48/i));
      expect(screen.queryByRole('button', { name: /make this my goal/i })).not.toBeInTheDocument();
    });

    it('shows a friendly message when saving fails, and the button works again', async () => {
      service.whatIf.mockResolvedValue(result(71, 11));
      service.saveWhatIfAsGoals.mockRejectedValue(new Error('We could not save that goal. Please try again.'));
      renderIt();
      move(/nice-to-haves/i, -5000);
      const button = await screen.findByRole('button', { name: /make this my goal/i });
      await user.click(button);
      expect(await screen.findByText(/could not save that goal/i)).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    it('forgets the "saved" message as soon as the user tries something different', async () => {
      service.whatIf.mockResolvedValue(result(71, 11));
      service.saveWhatIfAsGoals.mockResolvedValue({ created: [goal], existing: [] });
      renderIt();
      move(/nice-to-haves/i, -5000);
      await user.click(await screen.findByRole('button', { name: /make this my goal/i }));
      await screen.findByText(/goal saved/i);
      move(/nice-to-haves/i, -6000);
      await waitFor(() => expect(screen.queryByText(/goal saved/i)).not.toBeInTheDocument());
    });
  });
});
