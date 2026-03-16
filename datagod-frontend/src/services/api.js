import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  sendMessage: async (message, sessionId) => {
    try {
      const response = await apiClient.post('/chat', { message, session_id: sessionId });
      return response.data;
    } catch (error) {
      console.error('API Error sending message:', error);
      throw error;
    }
  },

  getHistory: async (sessionId) => {
    try {
      const response = await apiClient.get(`/history/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('API Error getting history:', error);
      throw error;
    }
  },

  getSchema: async () => {
    try {
      const response = await apiClient.get('/schema');
      return response.data;
    } catch (error) {
      console.error('API Error getting schema:', error);
      throw error;
    }
  },

  pinChart: async (chartData) => {
    try {
      const response = await apiClient.post('/dashboard/pin', { chart_data: chartData });
      return response.data;
    } catch (error) {
      console.error('API Error pinning chart:', error);
      throw error;
    }
  },

  getDashboard: async () => {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('API Error getting dashboard:', error);
      throw error;
    }
  },

  exportCSV: async (queryData) => {
    try {
      const response = await apiClient.post('/export/csv', { data: queryData });
      return response.data;
    } catch (error) {
      console.error('API Error exporting CSV:', error);
      throw error;
    }
  },

  executeQuery: async (sql, database = 'clinical') => {
    try {
      const response = await apiClient.post('/chat/query', { sql, database });
      return response.data;
    } catch (error) {
      console.error('API Error executing query:', error);
      throw error;
    }
  }
};

export default api;
