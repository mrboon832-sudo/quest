import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      message.error('Session expired. Please login again.');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      message.error('Access denied. Please ensure you are logged in.');
    } else if (error.response?.status === 500) {
      message.error(error.response.data?.error || 'Server error occurred');
    } else if (!error.response) {
      message.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      message.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    message.success('Logged out successfully');
  },
  isAuthenticated: () => !!localStorage.getItem('authToken'),
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export const dashboardService = {
  getStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      message.error('Failed to fetch dashboard statistics');
      throw error;
    }
  },
  getRiskDistribution: async () => {
    try {
      const response = await api.get('/dashboard/risk-distribution');
      return response.data;
    } catch (error) {
      console.error('Error fetching risk distribution:', error);
      message.error('Failed to fetch risk distribution');
      throw error;
    }
  },
  getTransactionTrend: async () => {
    try {
      const response = await api.get('/dashboard/transaction-trend');
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction trend:', error);
      message.error('Failed to fetch transaction trend');
      throw error;
    }
  },
};

export const transactionService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Failed to fetch transactions');
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      message.error('Failed to fetch transaction details');
      throw error;
    }
  },
  flagTransaction: async (id) => {
    try {
      const response = await api.put(`/transactions/${id}/flag`);
      message.success(response.data.message || 'Transaction flagged successfully');
      return response.data;
    } catch (error) {
      console.error('Error flagging transaction:', error);
      message.error(error.response?.data?.error || 'Failed to flag transaction');
      throw error;
    }
  },
};

export const networkService = {
  getFraudNetwork: async () => {
    try {
      const response = await api.get('/network/fraud-network');
      return response.data;
    } catch (error) {
      console.error('Error fetching fraud network:', error);
      message.error('Failed to fetch fraud network');
      throw error;
    }
  },
  getAccountConnections: async (accountId) => {
    try {
      const response = await api.get(`/network/connections/${accountId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching account connections:', error);
      message.error('Failed to fetch account connections');
      throw error;
    }
  },
};

export const reportService = {
  generateReport: async (type, params = {}) => {
    try {
      const response = await api.post('/reports/generate', { type, ...params });
      message.success('Report generated successfully');
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      message.error(error.response?.data?.error || 'Failed to generate report');
      throw error;
    }
  },
  getReportHistory: async () => {
    try {
      const response = await api.get('/reports');
      return response.data;
    } catch (error) {
      console.error('Error fetching report history:', error);
      message.error('Failed to fetch report history');
      throw error;
    }
  },
};

export default api;
