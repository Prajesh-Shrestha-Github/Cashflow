import api from './api'; // Your existing API configuration

const goalService = {
  // Fetch all goals
  getGoals: async () => {
    try {
      const response = await api.get('/financial/goals/');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch goals');
    }
  },

  // Create a new goal
  createGoal: async (goalData) => {
    try {
      const response = await api.post('/financial/goals/', goalData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create goal');
    }
  },

  // Update an existing goal
  updateGoal: async (id, goalData) => {
    try {
      const response = await api.put(`/financial/goals/${id}/`, goalData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update goal');
    }
  },

  // Delete a goal
  deleteGoal: async (id) => {
    try {
      const response = await api.delete(`/financial/goals/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete goal');
    }
  },

  // Fetch transactions for a goal
  getGoalTransactions: async (id) => {
    try {
      const response = await api.get(`/financial/goals/${id}/transactions/`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch goal transactions');
    }
  },

  // Update goal progress
  updateGoalProgress: async (id) => {
    try {
      const response = await api.get(`financial/goals/${id}/update_progress/`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update goal progress');
    }
  },
};

export default goalService;