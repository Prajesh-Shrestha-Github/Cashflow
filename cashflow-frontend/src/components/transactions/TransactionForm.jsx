// src/components/transactions/TransactionForm.jsx
import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import CategorySelect from './CategorySelect';

const TransactionForm = ({ transaction = null, onSuccess = () => {}, onCancel = () => {} }) => {
  const { addTransaction, updateTransaction, loading } = useTransactions();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    is_recurring: false
  });
  
  // If transaction prop is provided, populate form for editing
  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description || '',
        is_recurring: transaction.is_recurring || false
      });
    }
  }, [transaction]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({ ...prev, category: categoryId }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.date || !formData.amount || !formData.category) {
      return;
    }
    
    // Create or update transaction
    let success;
    if (transaction) {
      success = await updateTransaction(transaction.id, formData);
    } else {
      success = await addTransaction(formData);
    }
    
    if (success) {
      onSuccess();
      // Reset form if adding new transaction
      if (!transaction) {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          amount: '',
          category: '',
          description: '',
          is_recurring: false
        });
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        {transaction ? 'Edit Transaction' : 'Add Transaction'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <CategorySelect 
          value={formData.category} 
          onChange={handleCategoryChange} 
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter transaction description"
        />
      </div>
      
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="is_recurring"
            checked={formData.is_recurring}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Recurring Transaction</span>
        </label>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;