import api from './api';
import { SYMBOLS } from '../constants/symbols';

export const createDemoTick = (symbols) =>
  symbols.map((item) => {
    const price = Number(item.price);
    return {
      ...item,
      price,
      bid: price,
      ask: price + item.spread,
      change: Number(item.change) || 0,
      source: 'demo',
    };
  });

export const marketService = {
  async getPrices() {
    const { data } = await api.get('/market/prices');
    return data.symbols?.length ? data.symbols : createDemoTick(SYMBOLS);
  },
  async getCandles(symbol, timeframe) {
    const { data } = await api.get(`/market/candles/${encodeURIComponent(symbol)}`, { params: { timeframe } });
    return data.candles;
  },
};
