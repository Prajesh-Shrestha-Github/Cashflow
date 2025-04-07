// src/context/GoalsContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import goalService from '../services/goalService';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext'; // ✅ Get the current authenticated user

const GoalsContext = createContext();

export const useGoals = () => useContext(GoalsContext);

export const GoalsProvider = ({ children }) => {
  const { user } = useAuth(); // ✅ Access the logged-in user
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch all goals (only if user exists)
  const fetchGoals = useCallback(async () => {
    if (!user) return; // prevent fetching before auth
    try {
      setLoading(true);
      const data = await goalService.getGoals();
      setGoals(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a new goal
  const addGoal = async (goalData) => {
    try {
      setLoading(true);
      const newGoal = await goalService.createGoal(goalData);
      setGoals([...goals, newGoal]);
      toast.success('Goal added successfully');
      setError(null);
      return true;
    } catch (err) {
      toast.error('Failed to add goal');
      console.error(err);
      setError('Failed to add goal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing goal
  const updateGoal = async (id, goalData) => {
    try {
      setLoading(true);
      const updatedGoal = await goalService.updateGoal(id, goalData);
      setGoals(goals.map((goal) => (goal.id === id ? updatedGoal : goal)));
      toast.success('Goal updated successfully');
      setError(null);
      return true;
    } catch (err) {
      toast.error('Failed to update goal');
      console.error(err);
      setError('Failed to update goal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a goal
  const deleteGoal = async (id) => {
    try {
      setLoading(true);
      await goalService.deleteGoal(id);
      setGoals(goals.filter((goal) => goal.id !== id));
      toast.success('Goal deleted successfully');
      setError(null);
      return true;
    } catch (err) {
      toast.error('Failed to delete goal');
      console.error(err);
      setError('Failed to delete goal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update goal progress
  const updateProgress = async (id) => {
    try {
      setLoading(true);
      const updatedGoal = await goalService.updateGoalProgress(id);
      setGoals(goals.map((goal) => (goal.id === id ? updatedGoal : goal)));
      toast.success('Goal progress updated');
      setError(null);
      return true;
    } catch (err) {
      toast.error('Failed to update goal progress');
      console.error(err);
      setError('Failed to update goal progress');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Only fetch goals if user is authenticated
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const value = {
    goals,
    loading,
    error,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
  };

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
};
