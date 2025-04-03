// src/pages/TransactionsPage.jsx
import React, { useState } from 'react';
import { TransactionProvider } from '../context/TransactionContext';
import TransactionSummary from '../components/transactions/TransactionSummary';
import TransactionList from '../components/transactions/TransactionList';
import TransactionForm from '../components/transactions/TransactionForm';
import CsvImport from '../components/transactions/CsvImport';

const TransactionsPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'import'
  
  const handleAddSuccess = () => {
    setShowAddForm(false);
  };
  
  return (
    <TransactionProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {showAddForm ? 'Cancel' : 'Add Transaction'}
            </button>
          </div>
        </div>
        
        {showAddForm && (
          <div className="mb-6">
            <TransactionForm onSuccess={handleAddSuccess} onCancel={() => setShowAddForm(false)} />
          </div>
        )}
        
        <TransactionSummary />
        
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 px-6 ${
                  activeTab === 'transactions'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`py-4 px-6 ${
                  activeTab === 'import'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Import CSV
              </button>
            </nav>
          </div>
          
          <div className="mt-6">
            {activeTab === 'transactions' ? (
              <TransactionList />
            ) : (
              <CsvImport />
            )}
          </div>
        </div>
      </div>
    </TransactionProvider>
  );
};

export default TransactionsPage;