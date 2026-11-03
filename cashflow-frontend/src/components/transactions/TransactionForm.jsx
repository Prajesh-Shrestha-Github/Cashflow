// src/components/transactions/TransactionForm.jsx
import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import CategorySelect from './CategorySelect';

const TransactionForm = ({ transaction = null, onSuccess = () => {}, onCancel = () => {} }) => {
  const { addTransaction, updateTransaction, loading, availableGoals, categories } = useTransactions();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    is_recurring: false,
    financial_goal: '',
    // New fields for recurring transactions
    frequency: '',
    next_due_date: '',
    send_email_reminder: false
  });
  
  // Determine if the selected category is an expense
  const [isExpenseCategory, setIsExpenseCategory] = useState(false);
  const [isIncomeCategory, setIsIncomeCategory] = useState(false);
  
  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description || '',
        is_recurring: transaction.is_recurring || false,
        financial_goal: transaction.financial_goal || '',
        frequency: transaction.frequency || '',
        next_due_date: transaction.next_due_date || '',
        send_email_reminder: transaction.send_email_reminder || false
      });
    }
  }, [transaction]);
  
  // Check if selected category is an expense or income type
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.id === parseInt(formData.category));
      const isExpense = selectedCategory && selectedCategory.type === 'expense';
      const isIncome = selectedCategory && selectedCategory.type === 'income';
      
      setIsExpenseCategory(isExpense);
      setIsIncomeCategory(isIncome);
      
      // Reset financial goal if switching to expense category
      if (isExpense && formData.financial_goal) {
        setFormData(prev => ({ ...prev, financial_goal: '' }));
      }
      
      // Reset recurring fields if switching to income category
      if (isIncome && formData.is_recurring) {
        setFormData(prev => ({ 
          ...prev, 
          is_recurring: false,
          frequency: '',
          next_due_date: '',
          send_email_reminder: false
        }));
      }
    } else {
      setIsExpenseCategory(false);
      setIsIncomeCategory(false);
    }
  }, [formData.category, categories]);
  
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

  const handleGoalChange = (e) => {
    setFormData(prev => ({ ...prev, financial_goal: e.target.value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.amount || !formData.category) {
      return;
    }
    
    const payload = {
      ...formData,
      // Only include financial_goal if it's an income transaction
      financial_goal: isIncomeCategory && formData.financial_goal ? formData.financial_goal : null,
      // Only include recurring fields if it's a recurring transaction and an expense
      is_recurring: isExpenseCategory ? formData.is_recurring : false,
      frequency: formData.is_recurring && isExpenseCategory ? formData.frequency : null,
      next_due_date: formData.is_recurring && isExpenseCategory ? 
        (formData.next_due_date || formData.date) : null,
      send_email_reminder: formData.is_recurring && isExpenseCategory ? 
        formData.send_email_reminder : false
    };
    
    let success;
    if (transaction) {
      success = await updateTransaction(transaction.id, payload);
    } else {
      success = await addTransaction(payload);
    }
    
    if (success) {
      onSuccess();
      if (!transaction) {
        setFormData({
          date: new Date().toISOString().split('T')[0],
          amount: '',
          category: '',
          description: '',
          is_recurring: false,
          financial_goal: '',
          frequency: '',
          next_due_date: '',
          send_email_reminder: false
        });
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-card p-6 rounded-xl shadow-card">
      <h2 className="text-2xl font-bold mb-4">
        {transaction ? 'Edit Transaction' : 'Add Transaction'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label htmlFor="date" className="label">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="field"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="amount" className="label">
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
            className="field"
            required
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="label">
          Category
        </label>
        <CategorySelect 
          value={formData.category} 
          onChange={handleCategoryChange} 
        />
        {!formData.category && (
          <p className="text-sm text-ink-mute mt-1">
            Select a category to see available options
          </p>
        )}
        {formData.category && (
          <p className="text-sm text-ink-mute mt-1">
            {isIncomeCategory ? 'Income categories can be linked to financial goals' : 
             isExpenseCategory ? 'Expense categories can be set as recurring' : ''}
          </p>
        )}
      </div>
      
      {/* Only show financial goal selection for income categories */}
      {isIncomeCategory && (
        <div className="mb-4">
          <label htmlFor="financial_goal" className="label">
            Financial Goal (Optional)
          </label>
          <select
            id="financial_goal"
            name="financial_goal"
            value={formData.financial_goal}
            onChange={handleGoalChange}
            className="field"
          >
            <option value="">-- Select a Goal --</option>
            {availableGoals && availableGoals.map(goal => (
              <option key={goal.id} value={goal.id}>
                {goal.title} ({goal.goal_type})
              </option>
            ))}
          </select>
          <p className="text-sm text-ink-mute mt-1">Link this income to a financial goal</p>
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="field"
          placeholder="Enter transaction description"
        />
      </div>
      
      {/* Only show recurring option for expense categories */}
      {isExpenseCategory && (
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_recurring"
              checked={formData.is_recurring}
              onChange={handleChange}
              className="h-4 w-4 text-brand focus:ring-brand/40 border-line rounded"
            />
            <span className="ml-2 text-sm text-ink-soft">Recurring Transaction</span>
          </label>
          <p className="text-sm text-ink-mute mt-1 ml-6">
            Set up recurring payments for bills, subscriptions, etc.
          </p>
        </div>
      )}
      
      {/* Show recurring options only if it's a recurring transaction and an expense category */}
      {formData.is_recurring && isExpenseCategory && (
        <div className="mb-6 p-4 bg-paper rounded-lg border border-line">
          <h3 className="font-medium text-ink-soft mb-3">Recurring Options</h3>
          
          <div className="mb-4">
            <label htmlFor="frequency" className="label">
              Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="field"
              required={formData.is_recurring}
            >
              <option value="">-- Select Frequency --</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="next_due_date" className="label">
              Next Due Date (Optional)
            </label>
            <input
              type="date"
              id="next_due_date"
              name="next_due_date"
              value={formData.next_due_date}
              onChange={handleChange}
              className="field"
            />
            <p className="text-sm text-ink-mute mt-1">If not set, the transaction date will be used</p>
          </div>
          
          <div className="mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="send_email_reminder"
                checked={formData.send_email_reminder}
                onChange={handleChange}
                className="h-4 w-4 text-brand focus:ring-brand/40 border-line rounded"
              />
              <span className="ml-2 text-sm text-ink-soft">Send email reminders</span>
            </label>
            <p className="text-sm text-ink-mute mt-1 ml-6">
              You'll receive email reminders when this expense is due
            </p>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;