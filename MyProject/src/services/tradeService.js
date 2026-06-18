import api from './api';

export const tradeService = {
  open: (values) => api.post('/trades/open', values).then((response) => response.data),
  createPending: (values) => api.post('/trades/pending', values).then((response) => response.data),
  close: (id, price) => api.post(`/trades/close/${id}`, { price }).then((response) => response.data),
  openTrades: (tradingAccountId) => api.get('/trades/open', { params: tradingAccountId ? { tradingAccountId } : undefined }).then((response) => response.data),
  pendingTrades: (tradingAccountId) => api.get('/trades/pending', { params: tradingAccountId ? { tradingAccountId } : undefined }).then((response) => response.data),
  closedTrades: (tradingAccountId) => api.get('/trades/closed', { params: tradingAccountId ? { tradingAccountId } : undefined }).then((response) => response.data),
};
