import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  getRiskDistribution: async () => {
    const response = await api.get('/dashboard/risk-distribution');
    return response.data;
  },
  getTransactionTrend: async () => {
    const response = await api.get('/dashboard/transaction-trend');
    return response.data;
  },
};

export const transactionService = {
  getAll: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
  flagTransaction: async (id) => {
    const response = await api.put(`/transactions/${id}/flag`);
    return response.data;
  },
};

export const networkService = {
  getFraudNetwork: async () => {
    const response = await api.get('/network/fraud-graph');
    return response.data;
  },
  getAccountConnections: async (accountId) => {
    const response = await api.get(`/network/account/${accountId}/connections`);
    return response.data;
  },
};

export const reportService = {
  generateReport: async (type, params = {}) => {
    const response = await api.post('/reports/generate', { type, ...params });
    return response.data;
  },
  getReportHistory: async () => {
    const response = await api.get('/reports');
    return response.data;
  },
};

export default api;
