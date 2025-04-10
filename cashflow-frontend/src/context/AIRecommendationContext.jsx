import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import aiRecommendationService from '../services/aiRecommendationService';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const AIRecommendationContext = createContext();

export const useAIRecommendation = () => useContext(AIRecommendationContext);

export const AIRecommendationProvider = ({ children }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [remainingRequests, setRemainingRequests] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendationHistory = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await aiRecommendationService.getRecommendationHistory();
      setRecommendations(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch recommendation history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getRecommendation = useCallback(async (query, sarcasmLevel = 0) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const response = await aiRecommendationService.getRecommendation(query, sarcasmLevel);
      setRemainingRequests(response.requests_remaining);
      
      // Update recommendations list with the new one
      await fetchRecommendationHistory();
      
      return response;
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to get recommendation');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchRecommendationHistory]);

  // Fetch recommendation history when user is authenticated
  useEffect(() => {
    if (user) {
      fetchRecommendationHistory();
    }
  }, [user, fetchRecommendationHistory]);

  return (
    <AIRecommendationContext.Provider
      value={{
        recommendations,
        remainingRequests,
        loading,
        error,
        fetchRecommendationHistory,
        getRecommendation
      }}
    >
      {children}
    </AIRecommendationContext.Provider>
  );
};