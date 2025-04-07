import React, { useState } from 'react';
import { useGoals } from '../../context/GoalsContext';

const GoalForm = () => {
  const { addGoal } = useGoals();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'savings',
    target_amount: '',
    target_date: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 50) {
      newErrors.title = "Title must be less than 50 characters";
    }
    
    if (formData.description && formData.description.length > 200) {
      newErrors.description = "Description must be less than 200 characters";
    }
    
    if (!formData.target_amount || formData.target_amount <= 0) {
      newErrors.target_amount = "Please enter a valid target amount";
    }
    
    if (!formData.target_date) {
      newErrors.target_date = "Target date is required";
    } else {
      const selectedDate = new Date(formData.target_date);
      const today = new Date();
      if (selectedDate <= today) {
        newErrors.target_date = "Target date must be in the future";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await addGoal(formData);
      setFormData({
        title: '',
        description: '',
        goal_type: 'savings',
        target_amount: '',
        target_date: '',
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setErrors({ submit: "Failed to create goal. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to determine input classes
  const getInputClasses = (fieldName) => {
    const baseClasses = "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all";
    return errors[fieldName] 
      ? `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-200` 
      : `${baseClasses} border-gray-300 focus:border-blue-500 focus:ring-blue-200`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create New Financial Goal</h2>
      
      {showSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Goal successfully created!
        </div>
      )}

      {errors.submit && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {errors.submit}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
          <input
            type="text"
            placeholder="e.g., Emergency Fund, New Car"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={getInputClasses('title')}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            placeholder="Additional details about your goal"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={getInputClasses('description')}
            rows="3"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
          <select
            value={formData.goal_type}
            onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          >
            <option value="savings">Savings</option>
            <option value="debt_reduction">Debt Reduction</option>
            <option value="investment">Investment</option>
            <option value="expense_reduction">Expense Reduction</option>
            <option value="income_increase">Income Increase</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount ($)</label>
          <input
            type="number"
            placeholder="5000"
            value={formData.target_amount}
            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
            className={getInputClasses('target_amount')}
            min="0"
            step="0.01"
          />
          {errors.target_amount && <p className="mt-1 text-sm text-red-600">{errors.target_amount}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
          <input
            type="date"
            value={formData.target_date}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
            className={getInputClasses('target_date')}
          />
          {errors.target_date && <p className="mt-1 text-sm text-red-600">{errors.target_date}</p>}
        </div>
        
        <button 
          type="submit" 
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
            isSubmitting 
              ? "bg-blue-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200"
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : "Create Goal"}
        </button>
      </form>
    </div>
  );
};

export default GoalForm;