import api from './api';
import { SYMBOLS } from '../constants/symbols';

export const createDemoTick = (symbols) =>
  symbols.map((item) => {
    const change = (Math.random() - 0.5) * item.price * 0.0005;
    const price = Math.max(item.price + change, 0.00001);
    return {
      ...item,
      price,
      bid: price,
      ask: price + item.spread,
      change: ((price - item.price) / item.price) * 100,
    };
  });

export const marketService = {
  async getPrices() {
    try {
      const { data } = await api.get('/market/prices');
      return data.symbols?.length ? data.symbols : createDemoTick(SYMBOLS);
    } catch {
      return createDemoTick(SYMBOLS);
    }
  },
  async getCandles(symbol, timeframe) {
    const { data } = await api.get(`/market/candles/${encodeURIComponent(symbol)}`, { params: { timeframe } });
    return data.candles;
  },
};
