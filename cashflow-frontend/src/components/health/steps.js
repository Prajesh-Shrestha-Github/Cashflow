// What each "next step" says and where its button goes. Shared by the Money Health page and the dashboard strip.
import { formatNPR } from '../../utils/formatMoney';

export const STEPS = {
  save_more: { text: (s) => `Save ${formatNPR(s.amount)} more this month to reach 20%.`, label: 'Plan my savings', to: '/planner' },
  build_safety_net: {
    text: (s) => (s.amount ? `Build your safety net: ${formatNPR(s.amount)} more covers 3 months of essentials.` : 'Start an emergency fund goal.'),
    label: 'Start an emergency fund',
    to: '/goals',
  },
  check_in: { text: () => 'Add what you spent this week. It takes a minute.', label: "Add this week's spending", to: '/transactions', openForm: true },
  trim_wants: { text: (s) => `Trim ${formatNPR(s.amount)} from nice-to-haves to reach 30%.`, label: 'See my spending', to: '/transactions' },
  add_income: { text: () => 'Add your income so we can score your month.', label: 'Add my income', to: '/transactions', openForm: true },
  add_first_transaction: { text: () => 'Add your first income or expense. Your score appears right away.', label: 'Add my first transaction', to: '/transactions', openForm: true },
};

export const trimZero = (value) => Number(value).toFixed(1).replace(/\.0$/, '');
