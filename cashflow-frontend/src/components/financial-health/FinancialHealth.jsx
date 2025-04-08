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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Financial Health</h2>

      {/* Current Health */}
      {currentHealth ? (
        <div className="mb-6">
          <h3 className="text-xl font-semibold">Current Month</h3>
          <FinancialHealthBar
            healthStatus={currentHealth.health_status}
            savingsRate={currentHealth.savings_rate}
          />
          <p><strong>Month:</strong> {currentHealth.month_display}</p>
          <p><strong>Total Income:</strong> ${currentHealth.total_income}</p>
          <p><strong>Total Expenses:</strong> ${currentHealth.total_expenses}</p>
          <p><strong>Income-Expense Ratio:</strong> {currentHealth.income_expense_ratio}</p>
        </div>
      ) : (
        <p>No current financial health data available.</p>
      )}

      {/* Recalculate Button */}
      <div className="mb-6">
        <input
          type="date"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="mr-2 p-2 border rounded"
        />
        <button
          onClick={handleRecalculate}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Recalculate Health'}
        </button>
      </div>

      {/* Historical Data */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Historical Health</h3>
        {historicalHealth.length > 0 ? (
          <ul className="space-y-4">
            {historicalHealth.map((health) => (
              <li key={health.id} className="border p-4 rounded">
                <FinancialHealthBar
                  healthStatus={health.health_status}
                  savingsRate={health.savings_rate}
                />
                <p><strong>Month:</strong> {health.month_display}</p>
                <p><strong>Total Income:</strong> ${health.total_income}</p>
                <p><strong>Total Expenses:</strong> ${health.total_expenses}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No historical data available.</p>
        )}
      </div>
    </div>
  );
};

export default FinancialHealth;