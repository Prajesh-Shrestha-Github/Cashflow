// src/context/ReminderContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import reminderService from '../services/reminderService';
import { useAuth } from './AuthContext';

const ReminderContext = createContext();

export const useReminders = () => useContext(ReminderContext);

export const ReminderProvider = ({ children }) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await reminderService.getReminders();
      setReminders(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch reminders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load initial data only if user is available
  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user, fetchReminders]);

  const value = {
    reminders,
    loading,
    error,
    fetchReminders,
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};