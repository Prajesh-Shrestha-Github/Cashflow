import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { COLORS, CATEGORY_PALETTE, applyChartDefaults, gridOptions } from '../../utils/chartTheme';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title
);
applyChartDefaults(ChartJS);

const UserDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get(`/dashboard/?period=${timeRange}`);
        setDashboardData(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl bg-signal/10 p-4 text-signal">
        {error}
      </div>
    );
  }

  // Default values if backend doesn't provide the data yet
  const categoryBreakdown = dashboardData.category_breakdown || [
    { category: 'Food', amount: 300 },
    { category: 'Housing', amount: 1200 },
    { category: 'Transport', amount: 200 },
    { category: 'Entertainment', amount: 150 },
    { category: 'Other', amount: 250 }
  ];

  const trendData = dashboardData.trends || [
    { date: '1-Jan', income: 2000, expense: 1800 },
    { date: '8-Jan', income: 2100, expense: 1750 },
    { date: '15-Jan', income: 1950, expense: 1900 },
    { date: '22-Jan', income: 2200, expense: 1850 },
    { date: '29-Jan', income: 2300, expense: 1700 }
  ];

  const spendingPatterns = dashboardData.spending_patterns || [
    { day_of_week: 'Mon', average_amount: 80 },
    { day_of_week: 'Tue', average_amount: 65 },
    { day_of_week: 'Wed', average_amount: 75 },
    { day_of_week: 'Thu', average_amount: 90 },
    { day_of_week: 'Fri', average_amount: 120 },
    { day_of_week: 'Sat', average_amount: 150 },
    { day_of_week: 'Sun', average_amount: 95 }
  ];

  const insights = dashboardData.insights || [
    { 
      title: 'Weekend Spending', 
      description: 'You tend to spend more on weekends, especially on entertainment and dining out.' 
    },
    { 
      title: 'Monthly Savings', 
      description: 'Your savings rate is healthy at approximately 15% of your income.' 
    }
  ];

  // Enhanced stats with defaults
  const stats = {
    total_income: dashboardData.stats.total_income || 0,
    total_expense: dashboardData.stats.total_expense || 0,
    balance: dashboardData.stats.balance || 0,
    income_change: dashboardData.stats.income_change || 0,
    expense_change: dashboardData.stats.expense_change || 0,
    savings_rate: dashboardData.stats.savings_rate || 0
  };

  // Chart data (colours come from the shared chart theme)
  const expenseCategoryData = {
    labels: categoryBreakdown.map(item => item.category),
    datasets: [
      {
        label: 'Expense by Category',
        data: categoryBreakdown.map(item => item.amount),
        backgroundColor: CATEGORY_PALETTE,
        borderColor: COLORS.paper,
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const trendChartData = {
    labels: trendData.map(item => item.date),
    datasets: [
      {
        label: 'Income',
        data: trendData.map(item => item.income),
        borderColor: COLORS.brand,
        backgroundColor: COLORS.brandSoft,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: COLORS.brand,
        borderWidth: 2.5,
      },
      {
        label: 'Expenses',
        data: trendData.map(item => item.expense),
        borderColor: COLORS.signal,
        backgroundColor: COLORS.signalSoft,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: COLORS.signal,
        borderWidth: 2.5,
      },
    ],
  };

  const patternValues = spendingPatterns.map(item => item.average_amount);
  const peak = Math.max(...patternValues);
  const spendingPatternData = {
    labels: spendingPatterns.map(item => item.day_of_week || item.time_of_day),
    datasets: [
      {
        label: 'Average Spending',
        data: patternValues,
        // the single highest bar is highlighted with the accent
        backgroundColor: patternValues.map(v => (v === peak && peak > 0 ? COLORS.accent : COLORS.forest)),
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 36,
      },
    ],
  };

  const ranges = [['week', 'Week'], ['month', 'Month'], ['year', 'Year']];
  const changeTone = (n, goodWhenUp) => ((n > 0) === goodWhenUp ? 'text-mint' : 'text-coral');

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Hero balance */}
      <section className="relative overflow-hidden rounded-3xl bg-forest-deep p-6 text-paper sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-brand/40" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 right-24 h-24 w-24 rounded-full bg-accent" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-paper/60">
              Balance · this {timeRange}
            </p>
            <h2 className="sr-only">Welcome, {user.first_name || user.username}!</h2>
          </div>
          <div role="group" aria-label="Time range" className="flex rounded-xl bg-white/10 p-1">
            {ranges.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTimeRange(key)}
                aria-pressed={timeRange === key}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                  timeRange === key ? 'bg-accent text-forest-deep' : 'text-paper/70 hover:text-paper'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="relative mt-4 font-display text-6xl font-extrabold leading-none tracking-[-0.04em] sm:text-8xl">
          ${stats.balance.toLocaleString()}
        </p>

        <dl className="relative mt-8 grid gap-6 border-t border-white/15 pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-paper/60">Total Income</dt>
            <dd className="mt-1 font-display text-3xl font-bold tracking-tight">${stats.total_income.toLocaleString()}</dd>
            {stats.income_change !== 0 && (
              <p className={`mt-1 text-sm ${changeTone(stats.income_change, true)}`}>
                {stats.income_change > 0 ? '↑' : '↓'} {Math.abs(stats.income_change)}% from previous {timeRange}
              </p>
            )}
          </div>
          <div>
            <dt className="text-sm text-paper/60">Total Expenses</dt>
            <dd className="mt-1 font-display text-3xl font-bold tracking-tight">${stats.total_expense.toLocaleString()}</dd>
            {stats.expense_change !== 0 && (
              <p className={`mt-1 text-sm ${changeTone(stats.expense_change, false)}`}>
                {stats.expense_change > 0 ? '↑' : '↓'} {Math.abs(stats.expense_change)}% from previous {timeRange}
              </p>
            )}
          </div>
          <div>
            <dt className="text-sm text-paper/60">Savings Rate</dt>
            <dd className="mt-1 font-display text-3xl font-bold tracking-tight">{stats.savings_rate}%</dd>
          </div>
        </dl>
      </section>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <section className="card-pad lg:col-span-2">
          <h2 className="font-display text-2xl font-bold tracking-tight">Income vs Expense Trend</h2>
          <div className="mt-4 h-72">
            <Line
              data={trendChartData}
              options={{
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                  x: { ...gridOptions, grid: { display: false } },
                  y: { ...gridOptions, beginAtZero: true, ticks: { callback: value => `$${value}` } },
                },
                plugins: {
                  legend: { position: 'top', align: 'end' },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </section>

        <section className="card-pad">
          <h2 className="font-display text-2xl font-bold tracking-tight">Expense Breakdown</h2>
          <div className="mt-4 h-72">
            <Doughnut
              data={expenseCategoryData}
              options={{ maintainAspectRatio: false, cutout: '66%', plugins: { legend: { position: 'right' } } }}
            />
          </div>
        </section>

        <section className="card-pad">
          <h2 className="font-display text-2xl font-bold tracking-tight">Spending Patterns</h2>
          <div className="mt-4 h-72">
            <Bar
              data={spendingPatternData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  x: { ...gridOptions, grid: { display: false } },
                  y: { ...gridOptions, beginAtZero: true, ticks: { callback: value => `$${value}` } },
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Average Spending: $${context.raw.toLocaleString()}`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </section>

        <section className="card-pad lg:col-span-2">
          <h2 className="font-display text-2xl font-bold tracking-tight">Transaction Insights</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {insights && insights.map((insight, index) => (
              <div key={index} className="rounded-xl bg-paper p-4">
                <h3 className="font-display text-lg font-bold tracking-tight text-ink">{insight.title}</h3>
                <p className="mt-1 text-ink-mute">{insight.description}</p>
              </div>
            ))}
            {!insights || insights.length === 0 ? (
              <p className="italic text-ink-mute">Not enough transaction data to generate insights.</p>
            ) : null}
          </div>
        </section>
      </div>

      {/* Recent Transactions */}
      <section className="card-pad">
        <h2 className="font-display text-2xl font-bold tracking-tight">Recent Transactions</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-ink/15 text-left text-xs font-semibold uppercase tracking-wider text-ink-mute">
                <th className="py-3 pr-6">Date</th>
                <th className="py-3 pr-6">Category</th>
                <th className="py-3 pr-6">Type</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {dashboardData.recent_transactions && dashboardData.recent_transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="whitespace-nowrap py-3.5 pr-6 font-mono text-sm text-ink-mute">{transaction.date}</td>
                  <td className="whitespace-nowrap py-3.5 pr-6 text-sm text-ink-soft">{transaction.category}</td>
                  <td className="whitespace-nowrap py-3.5 pr-6">
                    <span className={`chip ${transaction.type === 'income' ? 'bg-brand-tint text-brand-dark' : 'bg-signal/10 text-signal'}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap py-3.5 text-right font-mono text-sm font-semibold tabular-nums ${transaction.type === 'income' ? 'text-brand' : 'text-signal'}`}>
                    ${transaction.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!dashboardData.recent_transactions || dashboardData.recent_transactions.length === 0) && (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-sm text-ink-mute">
                    No recent transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default UserDashboard;
