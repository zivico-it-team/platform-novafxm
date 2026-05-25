import api from './api';

export const walletService = {
  getWallet: () => api.get('/wallet').then((response) => response.data),
  getTransactions: () => api.get('/wallet/transactions').then((response) => response.data),
  deposit: (values) => api.post('/wallet/deposit', values).then((response) => response.data),
  withdraw: (values) => api.post('/wallet/withdraw', values).then((response) => response.data),
};
