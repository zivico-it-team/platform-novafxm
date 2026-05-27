import api from './api';
import { SYMBOLS } from '../constants/symbols';

export const createDemoTick = (symbols) =>
  symbols.map((item) => {
    const price = Number(item.price || 0);
    const decimals = Number(item.decimals ?? 2);
    const spread = Number(item.spread || 0);
    return {
      ...item,
      decimals,
      spread,
      spreadPoints: Number(item.spreadPoints || 0),
      price,
      bid: price,
      ask: price + spread,
      change: 0,
      source: 'demo',
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
