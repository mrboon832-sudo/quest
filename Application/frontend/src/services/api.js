import axios from 'axios';
import { message } from 'antd';

// Use relative URL to go through Vite proxy in dev, or direct to API_BASE_URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      message.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  register: async (fullName, email, password, phone, role) => {
    const response = await api.post('/auth/register', { fullName, email, password, phone, role });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  verify: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    message.success('Logged out successfully');
  },
  getUser: () => JSON.parse(localStorage.getItem('user')) || null,
};

export const dashboardService = {
  getStats: async () => (await api.get('/dashboard/stats')).data,
  getRiskDistribution: async () => (await api.get('/dashboard/risk-distribution')).data,
  getTransactionTrend: async () => (await api.get('/dashboard/transaction-trend')).data,
  getTransactions: async () => (await api.get('/transactions')).data,
};

export const transactionService = {
  getAll: async (params) => (await api.get('/transactions', { params })).data,
  getById: async (id) => (await api.get(`/transactions/${id}`)).data,
  getAnalysis: async (id) => (await api.get(`/transactions/${id}/analysis`)).data, // Added for RiskPage
  flagTransaction: async (id) => (await api.put(`/transactions/${id}/flag`)).data,
  createTransaction: async (data) => (await api.post('/transactions/create', data)).data,
};

export const networkService = {
  getFraudNetwork: async () => (await api.get('/network/fraud-network')).data,
  getAccountConnections: async (accountId) => (await api.get(`/network/connections/${accountId}`)).data,
};

export const reportService = {
  generateReport: async (type, params = {}) => (await api.post('/reports/generate', { type, ...params })).data,
  getReportHistory: async () => (await api.get('/reports')).data,
  downloadReport: async (reportId, format = 'csv') => {
    const response = await api.get(`/reports/${reportId}/download`, { params: { format }, responseType: 'blob' });
    return response.data;
  },
};

export const accountService = {
  getBalance: async () => (await api.get('/accounts/balance')).data,
  getRecentTransactions: async (limit = 5) => {
    const res = await api.get('/accounts/transactions', { params: { limit } });
    return res.data.transactions || [];
  },
  deposit: async (amount) => (await api.post('/accounts/deposit', { amount })).data,
  withdraw: async (amount) => (await api.post('/accounts/withdraw', { amount })).data,
  transfer: async (toAccountId, amount) => (await api.post('/accounts/transfer', { toAccountId, amount })).data,
};

export default api;
