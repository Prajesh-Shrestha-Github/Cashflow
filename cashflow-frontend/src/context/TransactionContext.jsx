// src/context/TransactionContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import transactionService from '../services/transactionService';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext'; // ✅ Added

const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }) => {
  const { user } = useAuth(); // ✅ Use authenticated user
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, balance: 0 });
  const [availableGoals, setAvailableGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    category: null,
    type: null,
  });

  const fetchTransactions = useCallback(async () => {
    if (!user) return; // ✅ prevent fetch if not authenticated
    try {
      setLoading(true);
      const data = await transactionService.getTransactions(filters);
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  const fetchCategories = useCallback(async () => {
    if (!user) return; // ✅ prevent fetch if not authenticated
    try {
      const data = await transactionService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, [user]);

  const fetchSummary = useCallback(async () => {
    if (!user) return;
    try {
      const data = await transactionService.getTransactionSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, [user]);

  const fetchAvailableGoals = useCallback(async () => {
    if (!user) return;
    try {
      const data = await transactionService.getAvailableGoals();
      setAvailableGoals(data);
    } catch (err) {
      console.error('Failed to fetch available goals:', err);
    }
  }, [user]);

  const addTransaction = async (transactionData) => {
    try {
      setLoading(true);
      await transactionService.createTransaction(transactionData);
      toast.success('Transaction added successfully');
      await fetchTransactions();
      await fetchSummary();
      await fetchAvailableGoals();
      return true;
    } catch (err) {
      toast.error('Failed to add transaction');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id, transactionData) => {
    try {
      setLoading(true);
      await transactionService.updateTransaction(id, transactionData);
      toast.success('Transaction updated successfully');
      await fetchTransactions();
      await fetchSummary();
      await fetchAvailableGoals();
      return true;
    } catch (err) {
      toast.error('Failed to update transaction');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      setLoading(true);
      await transactionService.deleteTransaction(id);
      toast.success('Transaction deleted successfully');
      setTransactions(transactions.filter(t => t.id !== id));
      await fetchSummary();
      await fetchAvailableGoals();
      return true;
    } catch (err) {
      toast.error('Failed to delete transaction');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const importCSV = async (file) => {
    try {
      setLoading(true);
      const result = await transactionService.importCSV(file);
      toast.success(result.message);
      await fetchTransactions();
      await fetchSummary();
      await fetchAvailableGoals();
      return true;
    } catch (err) {
      toast.error('Failed to import CSV');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Load initial data only if user is available
  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchTransactions();
      fetchSummary();
      fetchAvailableGoals();
    }
  }, [user, fetchCategories, fetchTransactions, fetchSummary, fetchAvailableGoals]);

  const value = {
    transactions,
    categories,
    summary,
    availableGoals,
    loading,
    error,
    filters,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importCSV,
    updateFilters,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
