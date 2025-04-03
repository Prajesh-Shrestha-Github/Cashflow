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
    <div className="bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold p-6 border-b">Transactions</h2>
      
      <TransactionFilter />
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No transactions found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
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