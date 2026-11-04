import React, { useState } from 'react';
import { useGoals } from '../../context/GoalsContext';
import GoalTransactions from './GoalTransaction';

const GoalItem = ({ goal }) => {
  const { deleteGoal, updateGoal, updateProgress } = useGoals();
  const [isEditing, setIsEditing] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [formData, setFormData] = useState({ ...goal });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteGoal(goal.id);
    } catch (error) {
      console.error("Failed to delete goal", error);
      alert("Failed to delete goal. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateGoal(goal.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update goal", error);
      alert("Failed to update goal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProgressUpdate = async () => {
    try {
      setIsUpdatingProgress(true);
      await updateProgress(goal.id);
    } catch (error) {
      console.error("Failed to update progress", error);
      alert("Failed to update progress. Please try again.");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const confirmDelete = () => {
    const confirmed = window.confirm('Are you sure you want to delete this goal?');
    if (confirmed) {
      handleDelete();
    }
  };

  // Function to calculate appropriate color based on completion percentage
  const getProgressColor = (percentage) => {
    if (percentage < 25) return "bg-signal";
    if (percentage < 50) return "bg-warn";
    if (percentage < 75) return "bg-brand/60";
    return "bg-brand";
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get icon based on goal type
  const getGoalTypeIcon = () => {
    switch (goal.goal_type) {
      case 'savings':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'debt_reduction':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'investment':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'expense_reduction':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        );
      case 'income_increase':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-card border border-line rounded-xl shadow-card hover:shadow-card transition-shadow duration-300">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="p-4">
          <h3 className="text-lg font-semibold text-ink mb-4">Edit Goal</h3>
          
          <div className="space-y-3">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                className="field"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="label">Target Amount ($)</label>
              <input
                type="number"
                className="field"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                required
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="label">Target Date</label>
              <input
                type="date"
                className="field"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-line hover:bg-line text-ink py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-line focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="inline-flex items-center justify-center p-2 bg-brand-tint text-brand-dark rounded-lg mr-3">
                {getGoalTypeIcon()}
              </span>
              <h3 className="text-lg font-semibold text-ink">{goal.title}</h3>
            </div>
            <div className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-brand-tint text-brand-dark">
              {goal.goal_type.replace('_', ' ')}
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full bg-line rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${getProgressColor(goal.completion_percentage)}`} 
                style={{ width: `${goal.completion_percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-ink-mute mt-1">
              <span>{goal.completion_percentage}% complete</span>
              <span>{goal.days_remaining} days remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="bg-paper p-3 rounded-lg">
              <p className="text-sm text-ink-mute">Target Amount</p>
              <p className="text-lg font-bold text-ink">${parseFloat(goal.target_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="bg-paper p-3 rounded-lg">
              <p className="text-sm text-ink-mute">Current Amount</p>
              <p className="text-lg font-bold text-ink">${parseFloat(goal.current_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
          </div>
          
          <div className="border-t border-line pt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="btn-ghost"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            
            <button
              onClick={confirmDelete}
              className="inline-flex items-center px-3 py-1.5 border border-line text-sm leading-5 font-medium rounded-lg text-signal bg-card hover:bg-signal/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-signal/40 disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </>
              )}
            </button>
            
            <button
              onClick={handleProgressUpdate}
              className="inline-flex items-center px-3 py-1.5 border border-line text-sm leading-5 font-medium rounded-lg text-brand-dark bg-card hover:bg-brand-tint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40 disabled:opacity-50"
              disabled={isUpdatingProgress}
            >
              {isUpdatingProgress ? (
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Update Progress
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="btn-ghost"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {showTransactions ? "Hide Transactions" : "View Transactions"}
            </button>
          </div>
          
          {showTransactions && (
            <div className="mt-4 border-t border-line pt-4">
              <GoalTransactions goalId={goal.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalItem;