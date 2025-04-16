// src/services/transactionService.js
import api from './api';

// Define base paths
const TRANSACTIONS_PATH = '/transactions/transactions/';
const CATEGORIES_PATH = '/transactions/categories/';

const transactionService = {
  // Get all transactions with optional filters
  async getTransactions(filters = {}) {
    let queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    const response = await api.get(`${TRANSACTIONS_PATH}?${queryParams}`);
    return response.data;
  },

  // Get transaction by ID
  async getTransaction(id) {
    const response = await api.get(`${TRANSACTIONS_PATH}${id}/`);
    return response.data;
  },

  // Create a new transaction (with recurring fields)
  async createTransaction(transactionData) {
    const response = await api.post(TRANSACTIONS_PATH, {
      ...transactionData,
      frequency: transactionData.is_recurring ? transactionData.frequency : null,
      next_due_date: transactionData.is_recurring
        ? (transactionData.next_due_date || transactionData.date)
        : null,
      send_email_reminder: transactionData.is_recurring
        ? transactionData.send_email_reminder
        : false
    });
    return response.data;
  },

  // Update an existing transaction (with recurring fields)
  async updateTransaction(id, transactionData) {
    const response = await api.put(`${TRANSACTIONS_PATH}${id}/`, {
      ...transactionData,
      frequency: transactionData.is_recurring ? transactionData.frequency : null,
      next_due_date: transactionData.is_recurring
        ? (transactionData.next_due_date || transactionData.date)
        : null,
      send_email_reminder: transactionData.is_recurring
        ? transactionData.send_email_reminder
        : false
    });
    return response.data;
  },

  // Delete a transaction
  async deleteTransaction(id) {
    const response = await api.delete(`${TRANSACTIONS_PATH}${id}/`);
    return response.data;
  },

  // Get transaction summary
  async getTransactionSummary() {
    const response = await api.get(`${TRANSACTIONS_PATH}summary/`);
    return response.data;
  },

  // Import transactions from CSV
  async importCSV(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`${TRANSACTIONS_PATH}import_csv/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get all categories
  async getCategories(type = null) {
    let url = CATEGORIES_PATH;
    if (type) {
      url += `?type=${type}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Get available financial goals for linking transactions
  async getAvailableGoals() {
    const response = await api.get(`${TRANSACTIONS_PATH}available_goals/`);
    return response.data;
  }
};

export default transactionService;
