import api from './api';

export const dashboardService = {
  getDashboard: () => api.get('/dashboard').then((response) => response.data),
  createAccount: (type) => api.post('/dashboard/accounts', { type }).then((response) => response.data),
};
