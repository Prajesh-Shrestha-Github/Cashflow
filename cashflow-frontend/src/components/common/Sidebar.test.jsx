// QA lab bug log: #11 (collapsed on any outside click), #14 (mobile drawer icon-only), #15 (links without
// accessible names), #16 (menu button overlapped the logo), #17 (drawer stayed open after choosing a page).
// Intended behaviour: the sidebar changes only via its own buttons, and automatically on narrow screens.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Layout from '../layout/Layout';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'alice', is_admin: false }, logout: vi.fn() }),
}));
vi.mock('../../services/auth', () => ({ logoutUser: vi.fn() }));

const user = userEvent.setup();
const setWidth = (px) => {
  window.innerWidth = px;
};

const PAGES = ['Dashboard', 'Transactions', 'Goals', 'Financial Health', 'AI Advisor', 'Articles', 'Bookmarks'];

const renderLayout = () =>
  render(
    <MemoryRouter>
      <Layout>
        <main>
          <h1>page content</h1>
          <input aria-label="an input in the page" />
        </main>
      </Layout>
    </MemoryRouter>,
  );

// "Open" means the labels are visible as TEXT. An aria-label is not text, so giving the icon-only links
// accessible names (bug #15) cannot make a collapsed sidebar look open.
const sidebarIsOpen = () => screen.queryByText('Dashboard') !== null;
const menu = () => screen.getByLabelText('Main menu');

describe('Sidebar (wide screen)', () => {
  beforeEach(() => setWidth(1440));
  afterEach(() => setWidth(1024));

  it('starts open', () => {
    renderLayout();
    expect(sidebarIsOpen()).toBe(true);
  });

  it('stays open when the user clicks on the page content (bug #11)', async () => {
    renderLayout();
    await user.click(screen.getByText('page content'));
    expect(sidebarIsOpen()).toBe(true);
  });

  it('stays open when the user clicks into a form field in the page (bug #11)', async () => {
    renderLayout();
    await user.click(screen.getByLabelText('an input in the page'));
    await user.type(screen.getByLabelText('an input in the page'), 'hello');
    expect(sidebarIsOpen()).toBe(true);
  });

  it('the toggle button collapses it, and expands it again', async () => {
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(sidebarIsOpen()).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(sidebarIsOpen()).toBe(true);
  });

  it('tells assistive technology whether it is expanded (aria-expanded on the toggle)', async () => {
    renderLayout();
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('stays collapsed when the user collapsed it and then clicks in the page', async () => {
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    await user.click(screen.getByText('page content'));
    expect(sidebarIsOpen()).toBe(false);
  });

  it('#15: when collapsed to icons, every link and the logout button still has an accessible name', async () => {
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(sidebarIsOpen()).toBe(false); // really icon-only

    const links = within(menu()).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('aria-label'))).toEqual(PAGES);
    links.forEach((link) => expect(link).toHaveAccessibleName());
    // title alone would also give a name, but it is the weakest source: require a real aria-label
    expect(within(menu()).getByRole('button', { name: 'Logout' })).toHaveAttribute('aria-label', 'Logout');
  });

  it('#15: when collapsed, hovering an icon shows its name as a tooltip (title)', async () => {
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(within(menu()).getByRole('link', { name: 'Goals' })).toHaveAttribute('title', 'Goals');
  });
});

describe('Sidebar (narrow screen drawer)', () => {
  beforeEach(() => setWidth(500));
  afterEach(() => setWidth(1024));

  it('starts closed with just a menu button', () => {
    renderLayout();
    expect(sidebarIsOpen()).toBe(false);
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });

  it('#14: opening the menu shows every page name as text, not only icons', async () => {
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    PAGES.forEach((name) => expect(within(menu()).getByText(name)).toBeInTheDocument());
    expect(within(menu()).getByText('Logout')).toBeInTheDocument();
  });

  it('#16: while open, the close button is inside the drawer and the floating open button is gone', async () => {
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
    expect(within(menu()).getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });

  it('the close button closes the drawer and brings back the menu button', async () => {
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(menu()).getByRole('button', { name: 'Close menu' }));

    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
    expect(sidebarIsOpen()).toBe(false);
  });

  it('#17: choosing a page closes the drawer', async () => {
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(menu()).getByRole('link', { name: 'Goals' }));

    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
    expect(sidebarIsOpen()).toBe(false);
  });

  it('tapping the dimmed area behind the drawer closes it', async () => {
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByTestId('menu-overlay'));
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });

  it('the collapsed drawer (closed) still gives every link an accessible name', () => {
    renderLayout();
    within(menu()).getAllByRole('link').forEach((link) => expect(link).toHaveAccessibleName());
  });
});
