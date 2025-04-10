import api from './api';

const aiRecommendationService = {
  // Get an AI recommendation
  getRecommendation: async (query, sarcasmLevel = 0) => {
    try {
      const response = await api.post('/recommendations/ask/', {
        query,
        sarcasm_level: sarcasmLevel
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        throw new Error("You've reached your daily limit of 3 AI recommendations. Please try again tomorrow!");
      }
      throw error;
    }
  },

  // Get recommendation history
  getRecommendationHistory: async () => {
    try {
      const response = await api.get('/recommendations/history/');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default aiRecommendationService;