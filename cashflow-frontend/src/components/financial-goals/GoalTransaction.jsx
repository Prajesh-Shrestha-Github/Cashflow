import React, { useState, useEffect } from 'react';
import goalService from '../../services/goalService';

const GoalTransactions = ({ goalId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const data = await goalService.getGoalTransactions(goalId);
        setTransactions(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [goalId]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-signal/10 border border-signal/30 text-signal px-4 py-3 rounded-xl">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-signal" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm">Error loading transactions: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-ink-soft">Transactions</h4>
        <span className="bg-brand-tint text-brand-dark text-sm font-medium px-2.5 py-0.5 rounded-full">
          {transactions.length} {transactions.length === 1 ? 'Transaction' : 'Transactions'}
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-6 text-ink-mute">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-ink-mute mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p>No transactions for this goal yet.</p>
          <p className="text-sm mt-1">Transactions will appear here when you make progress toward your goal.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-paper">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-ink-mute">
                  Date
                </th>
                <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-ink-mute">
                  Description
                </th>
                <th scope="col" className="px-4 py-2 text-right text-sm font-medium text-ink-mute">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-line">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-paper transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-ink-mute">
                    {transaction.date ? formatDate(transaction.date) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {transaction.description || 'Contribution'}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${transaction.amount >= 0 ? 'text-brand' : 'text-signal'}`}>
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(parseFloat(transaction.amount)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GoalTransactions;