// src/components/transactions/TransactionItem.jsx
import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import TransactionForm from './TransactionForm';

const TransactionItem = ({ transaction, isEditing, onEdit, onEditClose }) => {
  const { deleteTransaction } = useTransactions();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };
  
  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };
  
  const handleConfirmDelete = async () => {
    await deleteTransaction(transaction.id);
    setShowConfirmDelete(false);
  };
  
  if (isEditing) {
    return (
      <tr>
        <td colSpan="5" className="px-6 py-4">
          <TransactionForm 
            transaction={transaction} 
            onSuccess={onEditClose} 
            onCancel={onEditClose}
          />
        </td>
      </tr>
    );
  }
  
  const isIncome = transaction.category_type === 'income';
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(transaction.date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {transaction.category_name}
        </span>
        {transaction.is_recurring && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Recurring
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="max-w-xs truncate">
          {transaction.description || '—'}
        </div>
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
        isIncome ? 'text-green-600' : 'text-red-600'
      }`}>
        {isIncome ? '+ ' : '- '}
        {formatCurrency(Math.abs(transaction.amount))}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {showConfirmDelete ? (
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancelDelete}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="text-red-600 hover:text-red-900"
            >
              Confirm
            </button>
          </div>
        ) : (
          <div className="flex justify-end space-x-3">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-900"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-red-600 hover:text-red-900"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default TransactionItem;