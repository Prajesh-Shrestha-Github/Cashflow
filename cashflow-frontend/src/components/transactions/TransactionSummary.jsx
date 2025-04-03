// src/components/transactions/TransactionSummary.jsx
import React from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { formatCurrency, calculatePercentage } from '../../utils/formatUtils';

const TransactionSummary = () => {
  const { summary, loading } = useTransactions();
  
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  const { total_income, total_expenses, balance } = summary;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Financial Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <p className="text-sm font-medium text-green-800">Total Income</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(total_income)}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <p className="text-sm font-medium text-red-800">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(total_expenses)}</p>
        </div>
        
        <div className={`p-4 rounded-lg border ${
          balance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'
        }`}>
          <p className={`text-sm font-medium ${
            balance >= 0 ? 'text-blue-800' : 'text-orange-800'
          }`}>Balance</p>
          <p className={`text-2xl font-bold ${
            balance >= 0 ? 'text-blue-600' : 'text-orange-600'
          }`}>{formatCurrency(balance)}</p>
        </div>
      </div>
      
      {total_income > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Spending Rate</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(calculatePercentage(total_expenses, total_income), 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            You've spent {formatCurrency(total_expenses)} ({calculatePercentage(total_expenses, total_income)}%)
            of your {formatCurrency(total_income)} income
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionSummary;