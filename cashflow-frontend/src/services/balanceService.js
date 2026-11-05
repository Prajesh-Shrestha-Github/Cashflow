import api from './api';

// GET /api/dashboard/balance/ -> what you have, how it moved in 30 days, and a 30-day trend.
export async function getBalance() {
  try {
    const response = await api.get('/dashboard/balance/');
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) throw new Error('Please sign in again.');
    throw new Error('We could not load your balance. Please try again.');
  }
}
