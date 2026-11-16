// src/components/transactions/TransactionList.jsx
import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import TransactionItem from './TransactionItem';
import TransactionFilter from './TransactionFilter';

const TransactionList = () => {
  const { transactions, loading } = useTransactions();
  const [editingId, setEditingId] = useState(null);
  
  const handleEdit = (id) => {
    setEditingId(id);
  };
  
  const handleEditClose = () => {
    setEditingId(null);
  };
  
  return (
    <div>
      <h2 className="sr-only">Transaction list</h2>
      
      <TransactionFilter />
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-ink-mute">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-ink-mute">No transactions found.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th scope="col" className="border-b border-ink/15 px-4 py-3 text-left text-sm font-semibold text-ink-mute">
                  Date
                </th>
                <th scope="col" className="border-b border-ink/15 px-4 py-3 text-left text-sm font-semibold text-ink-mute">
                  Category
                </th>
                <th scope="col" className="border-b border-ink/15 px-4 py-3 text-left text-sm font-semibold text-ink-mute">
                  Description
                </th>
                <th scope="col" className="border-b border-ink/15 px-4 py-3 text-right text-sm font-semibold text-ink-mute">
                  Amount
                </th>
                <th scope="col" className="border-b border-ink/15 px-4 py-3 text-right text-sm font-semibold text-ink-mute">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {transactions.map(transaction => (
                <TransactionItem 
                  key={transaction.id} 
                  transaction={transaction} 
                  isEditing={transaction.id === editingId}
                  onEdit={() => handleEdit(transaction.id)} 
                  onEditClose={handleEditClose}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TransactionList;