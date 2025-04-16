// src/services/reminderService.js
import api from './api';

const REMINDERS_PATH = '/reminders/reminders/';

const reminderService = {
  // Get all recurring transaction reminders
  async getReminders() {
    const response = await api.get(REMINDERS_PATH);
    return response.data;
  },
};

export default reminderService;