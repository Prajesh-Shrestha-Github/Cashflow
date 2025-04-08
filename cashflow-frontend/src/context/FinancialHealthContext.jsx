import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import financialHealthService from '../services/financialHealthService';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext'; // ✅ Import AuthContext

const FinancialHealthContext = createContext();

export const useFinancialHealth = () => useContext(FinancialHealthContext);

export const FinancialHealthProvider = ({ children }) => {
  const { user } = useAuth(); // ✅ Get authenticated user

  const [currentHealth, setCurrentHealth] = useState(null);
  const [historicalHealth, setHistoricalHealth] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCurrentHealth = useCallback(async () => {
    if (!user) return; // ✅ Skip if user not loaded
    setLoading(true);
    try {
      const data = await financialHealthService.getCurrentHealth();
      setCurrentHealth(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch current financial health');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchHistoricalHealth = useCallback(async () => {
    if (!user) return; // ✅ Skip if user not loaded
    setLoading(true);
    try {
      const data = await financialHealthService.getHealthForMonth('');
      setHistoricalHealth(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch historical financial health');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const calculateHealth = useCallback(async (month, refreshAll = true) => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await financialHealthService.calculateHealth(month);
      toast.success('Financial health calculated successfully');
      await fetchCurrentHealth();
      if (refreshAll) await fetchHistoricalHealth();
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to calculate financial health');
    } finally {
      setLoading(false);
    }
  }, [user, fetchCurrentHealth, fetchHistoricalHealth]);

  // ✅ Fetch on load only when user is present
  useEffect(() => {
    if (user) {
      fetchCurrentHealth();
      fetchHistoricalHealth();
    }
  }, [user, fetchCurrentHealth, fetchHistoricalHealth]);

  return (
    <FinancialHealthContext.Provider
      value={{
        currentHealth,
        historicalHealth,
        loading,
        error,
        fetchCurrentHealth,
        fetchHistoricalHealth,
        calculateHealth,
      }}
    >
      {children}
    </FinancialHealthContext.Provider>
  );
};
