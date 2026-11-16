import api from './api';

// GET /api/score/ -> the Money Score for a month (default: the current month).
export async function getMoneyScore(month) {
  try {
    const response = await api.get('/score/', { params: month ? { month } : {} });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) throw new Error('Please sign in again.');
    throw new Error('We could not load your score. Please try again.');
  }
}

// POST /api/score/what-if/ -> the score if you changed some things. Nothing is saved.
export async function whatIf(deltas) {
  try {
    const response = await api.post('/score/what-if/', deltas);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) throw new Error('Please check the numbers you chose.');
    if (error.response?.status === 401) throw new Error('Please sign in again.');
    throw new Error('We could not work that out. Please try again.');
  }
}

// GET /api/score/recap/ -> the last 7 days compared with the 7 before.
export async function getRecap() {
  try {
    const response = await api.get('/score/recap/');
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) throw new Error('Please sign in again.');
    throw new Error('We could not load your week. Please try again.');
  }
}

// POST /api/score/what-if/goals/ -> turn a what-if into real goals (idempotent: saving twice creates nothing new).
export async function saveWhatIfAsGoals(deltas) {
  try {
    const response = await api.post('/score/what-if/goals/', deltas);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) throw new Error(error.response.data?.detail || 'Pick at least one money change first.');
    if (error.response?.status === 401) throw new Error('Please sign in again.');
    throw new Error('We could not save that goal. Please try again.');
  }
}
