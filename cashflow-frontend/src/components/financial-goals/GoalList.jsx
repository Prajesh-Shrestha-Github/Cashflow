import React, { useEffect } from 'react';
import { useGoals } from '../../context/GoalsContext';
import GoalItem from './GoalItem';

const GoalList = () => {
  const { goals, loading, error, fetchGoals } = useGoals();

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-signal/10 border border-signal/30 text-signal px-4 py-3 rounded-xl mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-signal" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-ink">Financial Goals</h2>
        <span className="bg-brand-tint text-brand-dark text-sm font-medium px-2.5 py-0.5 rounded-full">
          {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'}
        </span>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-ink-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-ink">No goals found</h3>
          <p className="mt-1 text-ink-mute">Get started by creating your first financial goal!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalItem key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalList;