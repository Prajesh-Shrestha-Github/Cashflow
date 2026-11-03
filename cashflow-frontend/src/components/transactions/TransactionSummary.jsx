// src/components/transactions/TransactionSummary.jsx
import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { formatCurrency, calculatePercentage } from '../../utils/formatUtils';

const TransactionSummary = () => {
  const { summary, loading } = useTransactions();
  
  if (loading) {
    return (
      <div className="card-pad animate-pulse">
        <div className="h-8 bg-line rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-20 bg-line rounded"></div>
          <div className="h-20 bg-line rounded"></div>
          <div className="h-20 bg-line rounded"></div>
        </div>
      </div>
    );
  }
  
  const { total_income, total_expenses, balance } = summary;
  
  return (
    <section className="card-pad" aria-label="Financial summary">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.3fr]">
        <div className="rounded-2xl bg-brand-tint p-5">
          <p className="text-sm font-medium text-brand-dark">Total Income</p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-brand-dark sm:text-4xl">{formatCurrency(total_income)}</p>
        </div>

        <div className="rounded-2xl bg-signal/10 p-5">
          <p className="text-sm font-medium text-signal">Total Expenses</p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-signal sm:text-4xl">{formatCurrency(total_expenses)}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-forest-deep p-5 text-paper">
          <div aria-hidden="true" className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-brand/40" />
          <p className="relative text-sm font-medium text-paper/70">Balance</p>
          <p className={`relative mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${balance >= 0 ? 'text-paper' : 'text-accent'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {total_income > 0 && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-ink">Spending Rate</p>
            <p className="font-mono text-sm tabular-nums text-ink-mute">{calculatePercentage(total_expenses, total_income)}%</p>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-paper">
            <div
              className="h-2.5 rounded-full bg-forest"
              style={{ width: `${Math.min(calculatePercentage(total_expenses, total_income), 100)}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-ink-mute">
            You've spent {formatCurrency(total_expenses)} ({calculatePercentage(total_expenses, total_income)}%)
            of your {formatCurrency(total_income)} income
          </p>
        </div>
      )}
    </section>
  );
};

export default TransactionSummary;
