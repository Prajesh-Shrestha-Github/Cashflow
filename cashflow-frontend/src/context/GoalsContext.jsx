// src/context/GoalsContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import goalService from '../services/goalService';
import { toast } from 'react-hot-toast';

const GoalsContext = createContext();

export const useGoals = () => useContext(GoalsContext);

export const GoalsProvider = ({ children }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all goals
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await goalService.getGoals();
      setGoals(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch goals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Update goal progress (if applicable)
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

  // Load initial data
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