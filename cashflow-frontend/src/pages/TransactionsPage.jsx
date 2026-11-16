// src/pages/TransactionsPage.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import TransactionSummary from '../components/transactions/TransactionSummary';
import TransactionList from '../components/transactions/TransactionList';
import TransactionForm from '../components/transactions/TransactionForm';
import CsvImport from '../components/transactions/CsvImport';
import PageHeader from '../components/common/PageHeader';

const TransactionsPage = () => {
  const location = useLocation();
  // The dashboard's "Add transaction" button links here with state.openForm
  const [showAddForm, setShowAddForm] = useState(Boolean(location.state?.openForm));
  const [activeTab, setActiveTab] = useState('transactions');

  const handleAddSuccess = () => {
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" />

      <TransactionSummary />

      <div className="card">

        {/* Tabs and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
          <nav className="flex rounded-xl bg-paper p-1" aria-label="Transactions views">
            <button
              onClick={() => setActiveTab('transactions')}
              aria-pressed={activeTab === 'transactions'}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-forest text-paper'
                  : 'text-ink-mute hover:text-ink'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('import')}
              aria-pressed={activeTab === 'import'}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'import'
                  ? 'bg-forest text-paper'
                  : 'text-ink-mute hover:text-ink'
              }`}
            >
              Import CSV
            </button>
          </nav>

          {/* Action Buttons */}
          <div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={showAddForm ? 'btn-ghost' : 'btn-accent'}
            >
              {showAddForm ? 'Cancel' : 'Add Transaction'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6">
          {showAddForm && (
            <div className="mb-6 border-b border-line pb-6">
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