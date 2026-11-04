import React from 'react';

const FinancialHealthBar = ({ healthStatus, savingsRate, hideTitle = false }) => {
  // Map health status to colors and descriptions
  const statusStyles = {
    excellent: { color: 'bg-brand', tone: 'text-brand', text: 'Excellent', width: '100%' },
    good: { color: 'bg-brand', tone: 'text-brand', text: 'Good', width: '75%' },
    fair: { color: 'bg-warn', tone: 'text-warn-dark', text: 'Fair', width: '50%' },
    poor: { color: 'bg-warn', tone: 'text-warn-dark', text: 'Poor', width: '25%' },
    critical: { color: 'bg-signal', tone: 'text-signal', text: 'Critical', width: '10%' },
  };

  const status = statusStyles[healthStatus] || statusStyles.critical;

  return (
    <div className="flex w-full flex-col gap-2">
      {!hideTitle && <h3 className="mb-3 font-display text-2xl font-bold tracking-tight">Financial Health</h3>}
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-paper">
        <div
          className={`${status.color} h-full transition-all duration-1000 ease-in-out`}
          style={{ width: savingsRate ? `${Math.min(savingsRate, 100)}%` : status.width }}
        />
      </div>
      <p className="mt-2 text-sm font-medium text-ink-soft">
        Status: <span className={`font-semibold ${status.tone}`}>{status.text}</span>
      </p>
      {savingsRate && (
        <p className="text-sm text-ink-mute">Savings Rate: {savingsRate}%</p>
      )}
    </div>
  );
};

export default FinancialHealthBar;