// src/utils/formatUtils.js

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  /**
   * Format a date string to a more readable format
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  /**
   * Parse date string to ISO format for API requests
   * @param {string} dateString - Date string from form input
   * @returns {string} ISO formatted date string
   */
  export const parseDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toISOString().split('T')[0];
  };
  
  /**
   * Get month name from a date
   * @param {Date} date - Date object
   * @returns {string} Month name
   */
  export const getMonthName = (date) => {
    return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
  };
  
  /**
   * Calculate percentage for visualization
   * @param {number} value - The value to calculate percentage for
   * @param {number} total - The total value
   * @returns {number} Percentage value
   */
  export const calculatePercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };