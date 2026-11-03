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
        <td colSpan="5" className="px-4 py-3.5">
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
    <tr className="transition-colors hover:bg-paper">
      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-ink">
        {formatDate(transaction.date)}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-ink">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isIncome ? 'bg-brand-tint text-brand-dark' : 'bg-signal/10 text-signal'
        }`}>
          {transaction.category_name}
        </span>
        {transaction.is_recurring && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-tint text-brand-dark">
            Recurring
          </span>
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-ink">
        <div className="max-w-xs truncate">
          {transaction.description || '—'}
        </div>
      </td>
      <td className={`px-4 py-3.5 whitespace-nowrap font-mono text-sm font-semibold tabular-nums text-right ${
        isIncome ? 'text-brand' : 'text-signal'
      }`}>
        {isIncome ? '+ ' : '- '}
        {formatCurrency(Math.abs(transaction.amount))}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium">
        {showConfirmDelete ? (
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancelDelete}
              className="text-ink-mute hover:text-ink"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="text-signal hover:text-signal"
            >
              Confirm
            </button>
          </div>
        ) : (
          <div className="flex justify-end space-x-3">
            <button
              onClick={onEdit}
              className="text-brand hover:text-brand-dark"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-signal hover:text-signal"
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