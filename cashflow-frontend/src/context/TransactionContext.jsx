// src/context/TransactionContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import transactionService from '../services/transactionService';
import { toast } from 'react-hot-toast';

const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, balance: 0 });
  const [availableGoals, setAvailableGoals] = useState([]); // New state for available financial goals
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    category: null,
    type: null,
  });

  // Fetch transactions based on filters
  const fetchTransactions = useCallback(async () => {
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
  }, [filters]);
  
  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await transactionService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch transaction summary
  const fetchSummary = useCallback(async () => {
    try {
      const data = await transactionService.getTransactionSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  // New: Fetch available financial goals for linking transactions
  const fetchAvailableGoals = useCallback(async () => {
    try {
      const data = await transactionService.getAvailableGoals();
      setAvailableGoals(data);
    } catch (err) {
      console.error('Failed to fetch available goals:', err);
    }
  }, []);

  // Add a new transaction
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

  // Update an existing transaction
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

  // Delete a transaction
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

  // Import transactions from CSV file
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

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Load initial data
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
    fetchAvailableGoals(); // Fetch available goals on initial load
  }, [fetchTransactions, fetchSummary, fetchAvailableGoals]);

  const value = {
    transactions,
    categories,
    summary,
    availableGoals, // Expose available goals to consumers
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
