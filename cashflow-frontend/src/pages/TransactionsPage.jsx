// src/pages/TransactionsPage.jsx
import React, { useState } from 'react';
import TransactionSummary from '../components/transactions/TransactionSummary';
import TransactionList from '../components/transactions/TransactionList';
import TransactionForm from '../components/transactions/TransactionForm';
import CsvImport from '../components/transactions/CsvImport';

const TransactionsPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');

  const handleAddSuccess = () => {
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="mb-4">
          <TransactionSummary />
        </div>

        {/* Tabs and Actions */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-6 font-medium ${
                activeTab === 'transactions'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-200'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-6 font-medium ${
                activeTab === 'import'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-200'
              }`}
            >
              Import CSV
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="py-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                showAddForm
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showAddForm ? 'Cancel' : 'Add Transaction'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {showAddForm && (
            <div className="mb-6 border-b border-gray-200 pb-6">
              <TransactionForm 
                onSuccess={handleAddSuccess} 
                onCancel={() => setShowAddForm(false)} 
              />
            </div>
          )}
          
          {activeTab === 'transactions' ? (
            <TransactionList />
          ) : (
            <CsvImport />
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;