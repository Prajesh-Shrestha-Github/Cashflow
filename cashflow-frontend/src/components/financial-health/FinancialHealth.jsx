import React, { useEffect, useState } from 'react';
import { useFinancialHealth } from '../../context/FinancialHealthContext';
import FinancialHealthBar from './FinancialHealthBar';

const FinancialHealth = () => {
  const {
    currentHealth,
    historicalHealth,
    loading,
    error,
    fetchCurrentHealth,
    fetchHistoricalHealth,
    calculateHealth,
  } = useFinancialHealth();
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    fetchCurrentHealth();
    fetchHistoricalHealth();
  }, [fetchCurrentHealth, fetchHistoricalHealth]);

  const handleRecalculate = () => {
    calculateHealth(selectedMonth || undefined); // Use undefined for current month
  };

  if (loading) return <p className="mt-4 text-ink-mute">Loading...</p>;
  if (error) return <p role="alert" className="mt-4 text-signal">Error: {error}</p>;

  const Row = ({ label, value }) => (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <dt className="text-ink-mute">{label}</dt>
      <dd className="font-mono font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );

  return (
    <div className="mt-5">
      {/* Current Health */}
      {currentHealth ? (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-lg font-bold">Current Month</h3>
            <dl className="mt-2">
              <Row label="Month" value={currentHealth.month_display} />
              <Row label="Total Income" value={`$${currentHealth.total_income}`} />
              <Row label="Total Expenses" value={`$${currentHealth.total_expenses}`} />
              <Row label="Income-Expense Ratio" value={currentHealth.income_expense_ratio} />
            </dl>
          </div>
          <div className="rounded-2xl bg-paper p-5">
            <FinancialHealthBar
              hideTitle
              healthStatus={currentHealth.health_status}
              savingsRate={currentHealth.savings_rate}
            />
          </div>
        </div>
      ) : (
        <p className="mb-8 text-ink-mute">No current financial health data available.</p>
      )}

      {/* Recalculate */}
      <div className="mb-8 flex flex-wrap items-end gap-3 rounded-2xl bg-paper p-4">
        <div>
          <label htmlFor="health-month" className="label">Month to recalculate</label>
          <input
            id="health-month"
            type="date"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="field w-auto"
          />
        </div>
        <button onClick={handleRecalculate} className="btn-primary" disabled={loading}>
          {loading ? 'Calculating...' : 'Recalculate Health'}
        </button>
      </div>

      {/* Historical Data */}
      <div>
        <h3 className="font-display text-lg font-bold">Historical Health</h3>
        {historicalHealth.length > 0 ? (
          <ul className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {historicalHealth.map((health) => (
              <li key={health.id} className="rounded-2xl border border-line p-5">
                <FinancialHealthBar
                  hideTitle
                  healthStatus={health.health_status}
                  savingsRate={health.savings_rate}
                />
                <dl className="mt-3">
                  <Row label="Month" value={health.month_display} />
                  <Row label="Total Income" value={`$${health.total_income}`} />
                  <Row label="Total Expenses" value={`$${health.total_expenses}`} />
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-ink-mute">No historical data available.</p>
        )}
      </div>
    </div>
  );
};

export default FinancialHealth;
