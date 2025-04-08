import api from './api';

const financialHealthService = {
  getCurrentHealth: async () => {
    try {
      const response = await api.get('/financial/health/current/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch current financial health');
    }
  },

  getHealthForMonth: async (month) => {
    try {
      const url = month ? `/health/?month=${month}` : '/financial/health/'; // Empty month fetches all records
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch financial health data');
    }
  },

  calculateHealth: async (month) => {
    try {
      const response = await api.post('/financial/health/calculate/', { month });
      return response.data;
    } catch (error) {
      throw new Error('Failed to calculate financial health');
    }
  },
};

export default financialHealthService;