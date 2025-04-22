import React from 'react';

const FinancialHealthBar = ({ healthStatus, savingsRate }) => {
  // Map health status to colors and descriptions
  const statusStyles = {
    excellent: { color: 'bg-green-500', text: 'Excellent', width: '100%' },
    good: { color: 'bg-blue-500', text: 'Good', width: '75%' },
    fair: { color: 'bg-yellow-500', text: 'Fair', width: '50%' },
    poor: { color: 'bg-orange-500', text: 'Poor', width: '25%' },
    critical: { color: 'bg-red-500', text: 'Critical', width: '10%' },
  };

  const status = statusStyles[healthStatus] || statusStyles.critical;

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <h3 className="text-lg font-semibold mb-2">Financial Health</h3>
      <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${status.color} h-full transition-all duration-1000 ease-in-out`}
          style={{ width: savingsRate ? `${Math.min(savingsRate, 100)}%` : status.width }}
        />
      </div>
      <p className="mt-2 text-sm font-medium text-gray-700">
        Status: <span className={`text-${status.color.split('-')[1]}-700`}>{status.text}</span>
      </p>
      {savingsRate && (
        <p className="text-sm text-gray-600">Savings Rate: {savingsRate}%</p>
      )}
    </div>
  );
};

export default FinancialHealthBar;