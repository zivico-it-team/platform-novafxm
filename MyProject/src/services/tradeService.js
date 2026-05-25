import api from './api';

export const tradeService = {
  open: (values) => api.post('/trades/open', values).then((response) => response.data),
  close: (id, price) => api.post(`/trades/close/${id}`, { price }).then((response) => response.data),
  openTrades: () => api.get('/trades/open').then((response) => response.data),
  closedTrades: () => api.get('/trades/closed').then((response) => response.data),
};
