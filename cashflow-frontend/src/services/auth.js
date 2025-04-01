import api from './api';

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/accounts/login/', credentials);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/accounts/register/', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const logoutUser = async () => {
  try {
    await api.post('/accounts/logout/');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local storage even if API call fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/accounts/user/');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// Request password reset (send email)
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/accounts/password-reset/', { email });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// Reset password with token
export const resetPassword = async (token, password) => {
  try {
    const response = await api.post('/accounts/password-reset/confirm/', {
      token,
      password: password
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};