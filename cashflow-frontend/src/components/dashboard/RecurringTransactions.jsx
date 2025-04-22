// src/components/dashboard/RecurringTransactions.jsx
import React, { useEffect, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import reminderService from '../../services/reminderService';
import { format, parseISO } from 'date-fns';

const RecurringTransactions = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch recurring transaction reminders
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setLoading(true);
        const data = await reminderService.getReminders();
        
        // Filter to only include upcoming expenses (days_remaining > 0 or exactly due today)
        const upcomingReminders = data.filter(reminder => reminder.days_remaining >= 0);
        
        // Sort by days remaining (soonest first)
        upcomingReminders.sort((a, b) => a.days_remaining - b.days_remaining);
        
        setReminders(upcomingReminders);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reminders:', err);
        setError('Failed to fetch recurring expenses');
        setLoading(false);
      }
    };

    fetchReminders();
  }, []);

  // Helper function to format dates
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to get status color based on days remaining
  const getStatusColor = (daysRemaining) => {
    if (daysRemaining === 0) return 'text-orange-600'; // Due today
    if (daysRemaining <= 3) return 'text-orange-500';  // Due soon
    if (daysRemaining <= 7) return 'text-blue-500';    // Coming up
    return 'text-green-500';                           // Further away
  };

  // Helper function to get status text
  const getStatusText = (daysRemaining) => {
    if (daysRemaining === 0) return 'Due today';
    return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
  };

  if (loading) return (
    <div className="h-64 bg-white rounded-lg shadow p-6 flex items-center justify-center">
      <h2 className="text-xl font-semibold mb-4">Upcoming Expenses</h2>
      <div className="py-8 text-center text-gray-500">
        <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Loading upcoming expenses...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-64 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upcoming Expenses</h2>
      <div className="py-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    </div>
  );

  if (reminders.length === 0) return (
    <div className="h-64 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Upcoming Expenses</h2>
      <div className="py-8 text-center text-gray-500">
        <svg className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-medium">No upcoming expenses</p>
        <p className="text-sm mt-1">Add recurring expenses to see them here</p>
      </div>
    </div>
  );

  return (
    <div className="h-64 bg-white rounded-lg shadow p-6 overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Upcoming Expenses</h2>
      <div className="space-y-4">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="border-b pb-4 last:border-0 last:pb-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">
                  {reminder.transaction.description || 'Unnamed Expense'}
                </h3>
                <p className="text-gray-600 font-semibold mt-1">
                  ${parseFloat(reminder.transaction.amount).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reminder.transaction.frequency && (
                    <span className="capitalize">{reminder.transaction.frequency}</span>
                  )}
                  {reminder.transaction.frequency && ' • '}
                  {reminder.transaction.category && (
                    <span>{reminder.transaction.category.name}</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Due: {formatDate(reminder.transaction.next_due_date)}
                </p>
                <p className={`text-sm font-medium mt-1 ${getStatusColor(reminder.days_remaining)}`}>
                  {getStatusText(reminder.days_remaining)}
                </p>
                {reminder.transaction.send_email_reminder && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-2 inline-block">
                    Email reminder
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecurringTransactions;